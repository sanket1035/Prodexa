"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  Lightbulb, ArrowRight, ArrowLeft, Sparkles, CheckCircle2,
  Loader2, Cpu, Globe, Database, Layers, Zap,
  Check, HelpCircle, Flame, Target, ShieldCheck
} from "lucide-react";

const WIZARD_STEPS = [
  { id: 1, label: "Idea", title: "Product Concept & Problem" },
  { id: 2, label: "Business", title: "Market & Business Model" },
  { id: 3, label: "Technical", title: "Architecture & Stack" },
  { id: 4, label: "Review", title: "Verify & Generate" },
];

const STREAMING_STEPS = [
  "Analyzing Problem & Opportunity...",
  "Evaluating Competitor Landscape & Market Gaps...",
  "Designing System Architecture & Mermaid Diagram...",
  "Selecting Production Tech Stack & Databases...",
  "Building Roadmap & Risk Mitigation Matrix...",
  "Computing Hybrid Quality Score & Starter Kit...",
];

export default function NewBlueprintPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Idea Fields (Clean empty inputs for custom user entry)
  const [name, setName] = useState("");
  const [idea, setIdea] = useState("");
  const [problem, setProblem] = useState("");
  const [targetUsers, setTargetUsers] = useState("");

  // Step 2: Business Fields
  const [industry, setIndustry] = useState("");
  const [businessModel, setBusinessModel] = useState("B2B SaaS");
  const [competitors, setCompetitors] = useState("");
  const [startupStage, setStartupStage] = useState("MVP");
  const [targetCustomerSize, setTargetCustomerSize] = useState("SMBs");

  // Step 3: Technical Context Fields
  const [preferredStack, setPreferredStack] = useState("Next.js 14, TypeScript, Tailwind");
  const [preferredDatabase, setPreferredDatabase] = useState("Firebase Firestore");
  const [platform, setPlatform] = useState("Web App");
  const [timeline, setTimeline] = useState("Hackathon (24-48h)");
  const [expectedScale, setExpectedScale] = useState("1K - 10K Users");
  const [hasAuth, setHasAuth] = useState(true);
  const [hasPayments, setHasPayments] = useState(true);
  const [hasAi, setHasAi] = useState(true);

  // Generation state
  const [loading, setLoading] = useState(false);
  const [streamIndex, setStreamIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Smart Autofill based on idea text
  useEffect(() => {
    const text = (idea + " " + problem).toLowerCase();
    if (!text.trim()) return;

    if (text.includes("doctor") || text.includes("health") || text.includes("patient") || text.includes("medical")) {
      if (!industry) setIndustry("Healthcare");
      if (!targetUsers) setTargetUsers("Doctors & Healthcare Providers");
    } else if (text.includes("food") || text.includes("kitchen") || text.includes("delivery") || text.includes("meal")) {
      if (!industry) setIndustry("Food Delivery / Logistics");
      if (!targetUsers) setTargetUsers("Busy Office Workers & Local Kitchens");
    } else if (text.includes("code") || text.includes("developer") || text.includes("github") || text.includes("api")) {
      if (!industry) setIndustry("DevTools / Software");
      if (!targetUsers) setTargetUsers("Software Engineers & DevOps Teams");
    } else if (text.includes("bank") || text.includes("pay") || text.includes("crypto") || text.includes("wallet")) {
      if (!industry) setIndustry("FinTech");
      if (!targetUsers) setTargetUsers("Cross-border Freelancers & Exporters");
    } else if (text.includes("course") || text.includes("student") || text.includes("quiz") || text.includes("learn")) {
      if (!industry) setIndustry("EdTech");
      if (!targetUsers) setTargetUsers("Bootcamp Students & Instructors");
    }
  }, [idea, problem]);

  // Live Heuristic Indicators (Step 1)
  const computeLiveIndicators = () => {
    const text = (idea + " " + problem).toLowerCase();
    let innovation = 3;
    let market = 3;
    let complexity = 3;
    let aiSuitability = 4;

    if (text.includes("ai") || text.includes("neural") || text.includes("agent") || text.includes("llm")) {
      innovation = 5;
      aiSuitability = 5;
    }
    if (text.includes("enterprise") || text.includes("b2b") || text.includes("saas")) {
      market = 4;
      complexity = 4;
    }
    if (text.includes("drug") || text.includes("quantum") || text.includes("crypto")) {
      complexity = 5;
    }
    if (text.includes("food") || text.includes("gym") || text.includes("booking")) {
      innovation = 2;
      aiSuitability = 3;
    }

    return { innovation, market, complexity, aiSuitability };
  };

  const indicators = computeLiveIndicators();

  const fillSampleIdea = () => {
    setName("Prodexa");
    setIdea("Autonomous AI Product Operating System for early-stage builders");
    setProblem("Early-stage builders launch without structured expert review on technical feasibility, UX, and open-source licenses.");
    setTargetUsers("Early-stage software founders, hackathon teams, incubator directors");
    setError(null);
  };

  const handleNextStep = () => {
    setError(null);
    if (currentStep === 1) {
      if (!name.trim() || !idea.trim() || !problem.trim()) {
        setError("Please enter your Product Name, What you are building, and Problem Statement.");
        return;
      }
    }
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const handlePrevStep = () => {
    setError(null);
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleGenerate = async () => {
    setError(null);
    setLoading(true);
    setStreamIndex(0);
    setCompletedSteps([]);

    const interval = setInterval(() => {
      setStreamIndex((prev) => {
        const next = prev < STREAMING_STEPS.length - 1 ? prev + 1 : prev;
        setCompletedSteps((c) => (c.includes(prev) ? c : [...c, prev]));
        return next;
      });
    }, 1000);

    try {
      const res = await fetch("/api/blueprint/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          idea,
          problem,
          targetUsers: targetUsers || "Early stage software builders",
          optionalIndustry: industry || undefined,
          optionalConstraints: `Timeline: ${timeline}, Database: ${preferredDatabase}, Features: ${[
            hasAuth ? "Auth" : "",
            hasPayments ? "Payments" : "",
            hasAi ? "AI Engine" : "",
          ].filter(Boolean).join(", ")}`,
          userId: user?.uid || "demo-user-123",
        }),
      });

      clearInterval(interval);
      const data = await res.json();

      if (!data.success || !data.blueprintId) {
        throw new Error(data.message || "Failed to generate AI Product Blueprint");
      }

      router.push(`/blueprint/${data.blueprintId}`);
    } catch (err: any) {
      clearInterval(interval);
      setError(err.message || "An error occurred during blueprint generation.");
      setLoading(false);
    }
  };

  // STREAMING GENERATION FULLSCREEN OVERLAY
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--bg)", color: "var(--text)" }}>
        <div className="max-w-lg w-full card p-8 space-y-6 anim-fade" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
          <div className="flex items-center gap-4 border-b pb-4" style={{ borderColor: "var(--border)" }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(217,119,6,0.12)", border: "1px solid rgba(217,119,6,0.2)", color: "var(--accent)" }}>
              <Loader2 className="w-6 h-6 anim-spin" />
            </div>
            <div>
              <h3 className="text-base font-semibold" style={{ color: "var(--text)" }}>Architecting {name}</h3>
              <p className="text-xs font-mono mt-0.5" style={{ color: "var(--text-muted)" }}>
                Prodexa AI Operating System is synthesizing system architecture...
              </p>
            </div>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {STREAMING_STEPS.map((stepLabel, idx) => {
              const isDone = completedSteps.includes(idx);
              const isCurrent = streamIndex === idx;
              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isDone
                      ? "badge-green"
                      : isCurrent
                      ? "border-amber-500/40 bg-amber-500/5 text-amber-500"
                      : "opacity-40 border-transparent"
                  }`}
                >
                  <span className="truncate">{stepLabel}</span>
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 anim-spin text-amber-500 flex-shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-gray-600 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ background: "var(--bg)", color: "var(--text)" }}>
      {/* Top Wizard Progress Indicator Bar */}
      <div className="border-b" style={{ background: "rgba(9,9,11,0.9)", borderColor: "var(--border)" }}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: "var(--accent)", color: "#09090B" }}>
              <Zap className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight">AI Blueprint Wizard</span>
          </div>

          {/* Stepper Steps */}
          <div className="flex items-center gap-2 sm:gap-6 font-mono text-xs">
            {WIZARD_STEPS.map((step) => {
              const isActive = currentStep === step.id;
              const isPassed = currentStep > step.id;
              return (
                <div key={step.id} className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                      isActive
                        ? "bg-amber-500 text-black shadow-lg"
                        : isPassed
                        ? "bg-green-500/20 text-green-500 border border-green-500/40"
                        : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {isPassed ? <Check className="w-3.5 h-3.5" /> : step.id}
                  </div>
                  <span className={`hidden md:inline ${isActive ? "text-white font-semibold" : "text-zinc-500"}`}>
                    {step.label}
                  </span>
                  {step.id < 4 && <span className="text-zinc-700 hidden sm:inline">•</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Wizard Content Area */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        {error && (
          <div className="badge badge-red p-4 rounded-xl text-xs mb-6 flex items-center justify-between anim-fade">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="font-bold">✕</button>
          </div>
        )}

        {/* STEP 1: IDEA */}
        {currentStep === 1 && (
          <div className="space-y-6 anim-fade">
            <div className="border-b pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ borderColor: "var(--border)" }}>
              <div>
                <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text)" }}>Step 1 — Product Concept &amp; Problem</h1>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  Define what you are building and who experiences this problem every day.
                </p>
              </div>
              <button
                type="button"
                onClick={fillSampleIdea}
                className="btn btn-secondary btn-sm text-amber-500 border-amber-500/30 flex-shrink-0"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Fill Sample Idea</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium flex items-center justify-between" style={{ color: "var(--text-secondary)" }}>
                    <span>Product Name *</span>
                    <span className="text-[10px] font-mono text-zinc-500">e.g. QuickBite, PharmaMatch</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Prodexa"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium flex items-center justify-between" style={{ color: "var(--text-secondary)" }}>
                    <span>What are you building? *</span>
                    <span className="text-[10px] font-mono text-zinc-500">One-line core solution</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Autonomous AI Product Operating System for early-stage builders"
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    className="input"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium flex items-center justify-between" style={{ color: "var(--text-secondary)" }}>
                    <span>What painful problem exists today? *</span>
                    <span className="text-[10px] font-mono text-zinc-500">Why does this matter?</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Early-stage builders launch without structured expert review on technical feasibility, UX, and open-source licenses..."
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                    className="input font-sans leading-relaxed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium flex items-center justify-between" style={{ color: "var(--text-secondary)" }}>
                    <span>Who experiences this problem every day?</span>
                    <span className="text-[10px] font-mono text-zinc-500">Target User / ICP</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Early-stage software founders, hackathon teams, incubator directors"
                    value={targetUsers}
                    onChange={(e) => setTargetUsers(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              {/* Live Heuristic Analysis Side Panel */}
              <div className="card p-5 space-y-4 self-start" style={{ background: "var(--bg-elevated)" }}>
                <div className="flex items-center gap-2 font-mono text-xs font-semibold" style={{ color: "var(--accent)" }}>
                  <Sparkles className="w-4 h-4" />
                  Live Heuristic Evaluation
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  Real-time preview of key innovation metrics as you type your product concept.
                </p>

                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1" style={{ color: "var(--text-muted)" }}>
                      <span>Innovation Rating</span>
                      <span className="font-bold text-amber-500">{"★".repeat(indicators.innovation)}</span>
                    </div>
                    <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
                      <div className="h-full bg-amber-500" style={{ width: `${(indicators.innovation / 5) * 100}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1" style={{ color: "var(--text-muted)" }}>
                      <span>Market Opportunity</span>
                      <span className="font-bold text-green-500">{"★".repeat(indicators.market)}</span>
                    </div>
                    <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: `${(indicators.market / 5) * 100}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1" style={{ color: "var(--text-muted)" }}>
                      <span>AI Suitability</span>
                      <span className="font-bold text-blue-400">{"★".repeat(indicators.aiSuitability)}</span>
                    </div>
                    <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
                      <div className="h-full bg-blue-400" style={{ width: `${(indicators.aiSuitability / 5) * 100}%` }} />
                    </div>
                  </div>
                </div>

                <div className="text-[10px] font-mono text-zinc-500 pt-2 border-t border-zinc-800 flex items-center gap-1">
                  <HelpCircle className="w-3 h-3" />
                  <span>Autofills industry details in Step 2</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: BUSINESS */}
        {currentStep === 2 && (
          <div className="space-y-6 anim-fade">
            <div className="border-b pb-4" style={{ borderColor: "var(--border)" }}>
              <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text)" }}>Step 2 — Business Model &amp; Market Segment</h1>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                Specify your industry vertical, business monetization, and competitor landscape.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                  <span>Industry Vertical</span>
                  <HelpCircle className="w-3 h-3 text-zinc-500" />
                </label>
                <input
                  type="text"
                  placeholder="Healthcare, FinTech, DevTools, EdTech"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="input"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Business Model</label>
                <select value={businessModel} onChange={(e) => setBusinessModel(e.target.value)} className="input font-mono">
                  <option value="B2B SaaS">B2B SaaS Subscription</option>
                  <option value="B2C Consumer">B2C Consumer SaaS</option>
                  <option value="Two-Sided Marketplace">Two-Sided Marketplace</option>
                  <option value="Usage-Based API">Usage-Based API / Pay-per-Call</option>
                  <option value="Freemium Open-Source">Freemium Open-Source</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Key Competitors (optional)</label>
                <input
                  type="text"
                  placeholder="ChatGPT, Linear, Manual Consultants"
                  value={competitors}
                  onChange={(e) => setCompetitors(e.target.value)}
                  className="input"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Startup Stage</label>
                <select value={startupStage} onChange={(e) => setStartupStage(e.target.value)} className="input font-mono">
                  <option value="Prototype">Day 0 Prototype / Idea</option>
                  <option value="MVP">MVP (Pre-Launch)</option>
                  <option value="Scaling">Scaling Product</option>
                  <option value="Enterprise">Enterprise</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: TECHNICAL CONTEXT */}
        {currentStep === 3 && (
          <div className="space-y-6 anim-fade">
            <div className="border-b pb-4" style={{ borderColor: "var(--border)" }}>
              <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text)" }}>Step 3 — Technical Stack &amp; Constraints</h1>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                Guide the AI on your preferred technology stack, database, and system features.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium flex items-center justify-between" style={{ color: "var(--text-secondary)" }}>
                  <span>Preferred Frontend/Backend Stack</span>
                  <HelpCircle className="w-3 h-3 text-zinc-500" />
                </label>
                <input
                  type="text"
                  value={preferredStack}
                  onChange={(e) => setPreferredStack(e.target.value)}
                  className="input font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Preferred Database</label>
                <input
                  type="text"
                  value={preferredDatabase}
                  onChange={(e) => setPreferredDatabase(e.target.value)}
                  className="input font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium flex items-center justify-between" style={{ color: "var(--text-secondary)" }}>
                  <span>Delivery Timeline</span>
                  <HelpCircle className="w-3 h-3 text-zinc-500" />
                </label>
                <select value={timeline} onChange={(e) => setTimeline(e.target.value)} className="input font-mono text-xs">
                  <option value="Hackathon (24-48h)">Hackathon Scope (24-48 hours)</option>
                  <option value="2 Weeks">2 Weeks Sprint</option>
                  <option value="1 Month">1 Month MVP</option>
                  <option value="Production">Production Scale</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Target Scale</label>
                <select value={expectedScale} onChange={(e) => setExpectedScale(e.target.value)} className="input font-mono text-xs">
                  <option value="100 Users">100 Users (Alpha)</option>
                  <option value="1K - 10K Users">1K - 10K Users (Beta)</option>
                  <option value="100K Users">100K Users (Growth)</option>
                  <option value="1M+ Users">1M+ Users (Scale)</option>
                </select>
              </div>
            </div>

            {/* Checkbox Feature Toggles */}
            <div className="card p-4 space-y-3" style={{ background: "var(--bg-elevated)" }}>
              <div className="text-xs font-semibold font-mono" style={{ color: "var(--accent)" }}>System Feature Inclusions</div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={hasAuth} onChange={(e) => setHasAuth(e.target.checked)} className="rounded accent-amber-500" />
                  <span>User Authentication</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={hasPayments} onChange={(e) => setHasPayments(e.target.checked)} className="rounded accent-amber-500" />
                  <span>Stripe Payments</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={hasAi} onChange={(e) => setHasAi(e.target.checked)} className="rounded accent-amber-500" />
                  <span>AI Inference Engine</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW & GENERATE */}
        {currentStep === 4 && (
          <div className="space-y-6 anim-fade">
            <div className="border-b pb-4" style={{ borderColor: "var(--border)" }}>
              <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text)" }}>Step 4 — Verify Specifications &amp; Generate</h1>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                Review your product specifications before triggering the AI Operating System synthesis.
              </p>
            </div>

            <div className="card p-6 space-y-4 font-mono text-xs" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border)" }}>
                <span className="font-bold text-sm text-white">{name}</span>
                <span className="badge badge-amber text-[10px] uppercase">{industry || "SaaS / Software"}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-zinc-500">Core Solution:</div>
                  <div className="text-zinc-200 mt-0.5">{idea}</div>
                </div>
                <div>
                  <div className="text-zinc-500">Problem Statement:</div>
                  <div className="text-zinc-200 mt-0.5">{problem}</div>
                </div>
                <div>
                  <div className="text-zinc-500">Target ICP:</div>
                  <div className="text-zinc-200 mt-0.5">{targetUsers || "Early stage founders"}</div>
                </div>
                <div>
                  <div className="text-zinc-500">Technology Stack:</div>
                  <div className="text-zinc-200 mt-0.5">{preferredStack} + {preferredDatabase}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="flex items-center justify-between pt-6 border-t mt-8" style={{ borderColor: "var(--border)" }}>
          {currentStep > 1 ? (
            <button onClick={handlePrevStep} className="btn btn-secondary btn-md">
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : <div />}

          {currentStep < 4 ? (
            <button onClick={handleNextStep} className="btn btn-primary btn-md">
              <span>Continue to Step {currentStep + 1}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleGenerate} className="btn btn-primary btn-lg">
              <Sparkles className="w-4 h-4" />
              <span>Generate AI Product Blueprint</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
