"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Lightbulb, ArrowRight, AlertCircle, Sparkles, CheckCircle2, Loader2 } from "lucide-react";

export default function NewBlueprintPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [idea, setIdea] = useState("");
  const [problem, setProblem] = useState("");
  const [targetUsers, setTargetUsers] = useState("");
  const [optionalIndustry, setOptionalIndustry] = useState("");
  const [optionalConstraints, setOptionalConstraints] = useState("");

  const [loading, setLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const steps = [
    "Analyzing Problem & Solution Statement...",
    "Evaluating Competitor Landscape & Market Gaps...",
    "Structuring Core MVP Feature Architecture...",
    "Recommending Production Tech Stack & Risk Matrix...",
    "Designing Firestore Database & API Payload Contract...",
    "Computing Blueprint Quality Score & Mermaid System Diagram...",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !idea || !problem) {
      setError("Project Name, Idea Description, and Problem Statement are required.");
      return;
    }

    setLoading(true);
    setStepIndex(0);

    // Simulate real-time progress steps while generation occurs
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1200);

    try {
      const res = await fetch("/api/blueprint/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          idea,
          problem,
          targetUsers: targetUsers || undefined,
          optionalIndustry: optionalIndustry || undefined,
          optionalConstraints: optionalConstraints || undefined,
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
      setError(err.message || "An unexpected error occurred during blueprint generation.");
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto w-full space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-mono tracking-wider uppercase text-[#D97B3F] bg-[#D97B3F]/10 px-2.5 py-1 rounded-[4px] border border-[#D97B3F]/20 mb-2">
          <Lightbulb className="w-3.5 h-3.5" />
          Idea → Blueprint Stage
        </div>
        <h1 className="text-2xl font-medium text-[#EDEDEF] tracking-tight">
          Generate AI Product Blueprint
        </h1>
        <p className="text-sm text-[#8B8F97] mt-1">
          Turn your Day 0 idea into structured startup documentation with a Quality Score (0–100) and Mermaid system architecture.
        </p>
      </div>

      {error && (
        <div className="bg-[#C25A4D]/10 border border-[#C25A4D]/30 text-[#C25A4D] rounded-[6px] p-4 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {loading ? (
        <div className="bg-[#16181B] border border-[#2A2D31] rounded-[6px] p-8 space-y-6 text-center max-w-xl mx-auto my-8">
          <div className="w-12 h-12 bg-[#D97B3F]/10 border border-[#D97B3F]/30 rounded-full flex items-center justify-center mx-auto text-[#D97B3F]">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-medium text-[#EDEDEF]">Generating AI Product Blueprint</h3>
            <p className="text-xs font-mono text-[#D97B3F]">{steps[stepIndex]}</p>
          </div>

          <div className="space-y-2 pt-4 border-t border-[#2A2D31] text-left text-xs font-mono">
            {steps.map((st, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-2 transition-all ${
                  idx < stepIndex
                    ? "text-[#5FA88A]"
                    : idx === stepIndex
                    ? "text-[#EDEDEF] font-medium"
                    : "opacity-30 text-[#8B8F97]"
                }`}
              >
                {idx < stepIndex ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#5FA88A]" />
                ) : idx === stepIndex ? (
                  <Loader2 className="w-3.5 h-3.5 text-[#D97B3F] animate-spin" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-[#2A2D31]" />
                )}
                <span>{st.replace("...", "")}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-[#16181B] border border-[#2A2D31] rounded-[6px] p-6 space-y-6">
          {/* Project Name */}
          <div className="space-y-2">
            <label className="block text-xs font-mono uppercase tracking-wider text-[#EDEDEF]">
              Project Name <span className="text-[#D97B3F]">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. ContractGuard AI"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#0B0C0E] border border-[#2A2D31] rounded-[6px] px-3.5 py-2.5 text-sm text-[#EDEDEF] placeholder-[#8B8F97]/50 focus:border-[#D97B3F] outline-none transition-colors"
            />
          </div>

          {/* Idea Description */}
          <div className="space-y-2">
            <label className="block text-xs font-mono uppercase tracking-wider text-[#EDEDEF]">
              Idea Description <span className="text-[#D97B3F]">*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="Describe what your product does and how it creates value for users..."
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              className="w-full bg-[#0B0C0E] border border-[#2A2D31] rounded-[6px] p-3 text-sm text-[#EDEDEF] placeholder-[#8B8F97]/50 focus:border-[#D97B3F] outline-none transition-colors"
            />
          </div>

          {/* Problem Statement */}
          <div className="space-y-2">
            <label className="block text-xs font-mono uppercase tracking-wider text-[#EDEDEF]">
              Problem Statement <span className="text-[#D97B3F]">*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="What painful problem are you solving? Who suffers from this gap?"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              className="w-full bg-[#0B0C0E] border border-[#2A2D31] rounded-[6px] p-3 text-sm text-[#EDEDEF] placeholder-[#8B8F97]/50 focus:border-[#D97B3F] outline-none transition-colors"
            />
          </div>

          {/* Target Audience */}
          <div className="space-y-2">
            <label className="block text-xs font-mono uppercase tracking-wider text-[#EDEDEF]">
              Target Audience / ICP <span className="text-[#8B8F97] font-sans normal-case">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Freelance designers, early-stage SaaS founders, hackathon teams"
              value={targetUsers}
              onChange={(e) => setTargetUsers(e.target.value)}
              className="w-full bg-[#0B0C0E] border border-[#2A2D31] rounded-[6px] px-3.5 py-2.5 text-sm text-[#EDEDEF] placeholder-[#8B8F97]/50 focus:border-[#D97B3F] outline-none transition-colors"
            />
          </div>

          {/* Optional Industry & Constraints */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-[#EDEDEF]">
                Industry <span className="text-[#8B8F97] font-sans normal-case">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Developer Tools, LegalTech, FinTech"
                value={optionalIndustry}
                onChange={(e) => setOptionalIndustry(e.target.value)}
                className="w-full bg-[#0B0C0E] border border-[#2A2D31] rounded-[6px] px-3.5 py-2.5 text-sm text-[#EDEDEF] placeholder-[#8B8F97]/50 focus:border-[#D97B3F] outline-none transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-[#EDEDEF]">
                Build Constraints <span className="text-[#8B8F97] font-sans normal-case">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 24h Hackathon build, Next.js + Firebase stack"
                value={optionalConstraints}
                onChange={(e) => setOptionalConstraints(e.target.value)}
                className="w-full bg-[#0B0C0E] border border-[#2A2D31] rounded-[6px] px-3.5 py-2.5 text-sm text-[#EDEDEF] placeholder-[#8B8F97]/50 focus:border-[#D97B3F] outline-none transition-colors"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-[#D97B3F] hover:bg-[#E88A4E] text-[#0B0C0E] font-medium py-3 px-6 rounded-[6px] text-base transition-colors focus-visible:outline-2 focus-visible:outline-[#D97B3F]"
            >
              <Sparkles className="w-4 h-4" />
              Generate AI Product Blueprint
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
