"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Lightbulb, ArrowRight, AlertCircle, Sparkles, CheckCircle2, Loader2, Users, Wrench, Building2 } from "lucide-react";

const STEPS = [
  "Analyzing Problem & Solution Statement...",
  "Evaluating Competitor Landscape & Market Gaps...",
  "Structuring Core MVP Feature Architecture...",
  "Recommending Production Tech Stack & Risk Matrix...",
  "Designing Firestore Database & API Payload Contract...",
  "Computing Blueprint Quality Score & Mermaid System Diagram...",
];

const Field = ({ label, required, optional, hint, children }: {
  label: string; required?: boolean; optional?: boolean; hint?: string; children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-medium text-[#A1A1AA]">
      {label}
      {required && <span className="text-[#EF4444] ml-1">*</span>}
      {optional && <span className="text-[#3F3F46] ml-1">(optional)</span>}
    </label>
    {children}
    {hint && <p className="text-xs text-[#71717A] leading-relaxed">{hint}</p>}
  </div>
);

const inputClass = "w-full bg-[#111113] border border-white/[0.10] hover:border-white/[0.16] focus:border-[#D97706]/60 rounded-xl px-4 py-3 text-sm text-[#FAFAFA] placeholder-[#3F3F46] outline-none transition-colors";
const textareaClass = inputClass + " resize-none";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !idea || !problem) {
      setError("Project Name, Idea Description, and Problem Statement are required.");
      return;
    }

    setLoading(true);
    setStepIndex(0);

    const interval = setInterval(() => {
      setStepIndex((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 1200);

    try {
      const res = await fetch("/api/blueprint/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, idea, problem,
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

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-[#111113] border border-white/[0.08] rounded-2xl p-8 space-y-6 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#D97706]/10 border border-[#D97706]/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Loader2 className="w-5 h-5 text-[#D97706] animate-spin" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#FAFAFA]">Generating Blueprint</h3>
              <p className="text-xs text-[#D97706] font-mono mt-0.5">{STEPS[stepIndex]}</p>
            </div>
          </div>

          <div className="space-y-2.5 pt-2 border-t border-white/[0.08]">
            {STEPS.map((st, idx) => (
              <div key={idx} className={`flex items-center gap-2.5 text-xs transition-all ${
                idx < stepIndex ? "text-[#22C55E]" : idx === stepIndex ? "text-[#FAFAFA] font-medium" : "text-[#3F3F46]"
              }`}>
                {idx < stepIndex ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E] flex-shrink-0" />
                ) : idx === stepIndex ? (
                  <Loader2 className="w-3.5 h-3.5 text-[#D97706] animate-spin flex-shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-white/[0.12] flex-shrink-0" />
                )}
                <span className="font-mono">{st.replace("...", "")}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto w-full space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 text-[11px] font-mono tracking-widest uppercase text-[#D97706] bg-[#D97706]/10 border border-[#D97706]/20 px-3 py-1.5 rounded-full mb-4">
          <Lightbulb className="w-3 h-3" />
          Option A — New Idea
        </div>
        <h1 className="text-2xl font-semibold text-[#FAFAFA] tracking-tight mb-2">
          Generate AI Product Blueprint
        </h1>
        <p className="text-sm text-[#71717A] leading-relaxed max-w-lg">
          Turn your Day 0 idea into structured startup documentation — Quality Score, competitor analysis, system architecture, and tech stack recommendation in under 15 seconds.
        </p>
      </div>

      {error && (
        <div className="bg-[#EF4444]/8 border border-[#EF4444]/20 text-[#EF4444] rounded-xl p-4 text-sm flex items-start gap-3 animate-fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Section: Project Basics */}
        <div className="bg-[#111113] border border-white/[0.08] rounded-2xl p-5 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-white/[0.07]">
            <Lightbulb className="w-4 h-4 text-[#D97706]" />
            <span className="text-sm font-semibold text-[#FAFAFA]">Project Basics</span>
          </div>

          <Field label="Project Name" required hint="What is this product called?">
            <input
              type="text"
              required
              placeholder="e.g. ContractGuard AI"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Idea Description" required hint="Describe what your product does and how it creates value for users.">
            <textarea
              rows={3}
              required
              placeholder="Describe what your product does and how it creates value for users..."
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              className={textareaClass}
            />
          </Field>

          <Field label="Problem Statement" required hint="What painful problem are you solving? Who suffers from this gap?">
            <textarea
              rows={3}
              required
              placeholder="What painful problem are you solving? Who suffers from this gap?"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              className={textareaClass}
            />
          </Field>
        </div>

        {/* Section: Audience & Context */}
        <div className="bg-[#111113] border border-white/[0.08] rounded-2xl p-5 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-white/[0.07]">
            <Users className="w-4 h-4 text-[#A1A1AA]" />
            <span className="text-sm font-semibold text-[#FAFAFA]">Audience & Context</span>
            <span className="text-xs text-[#3F3F46] font-mono ml-auto">optional — improves quality</span>
          </div>

          <Field label="Target Audience / ICP" optional>
            <input
              type="text"
              placeholder="e.g. Freelance designers, early-stage SaaS founders, hackathon teams"
              value={targetUsers}
              onChange={(e) => setTargetUsers(e.target.value)}
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Industry" optional>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#3F3F46]" />
                <input
                  type="text"
                  placeholder="e.g. Developer Tools, FinTech"
                  value={optionalIndustry}
                  onChange={(e) => setOptionalIndustry(e.target.value)}
                  className="w-full bg-[#111113] border border-white/[0.10] hover:border-white/[0.16] focus:border-[#D97706]/60 rounded-xl pl-10 pr-4 py-3 text-sm text-[#FAFAFA] placeholder-[#3F3F46] outline-none transition-colors"
                />
              </div>
            </Field>

            <Field label="Build Constraints" optional>
              <div className="relative">
                <Wrench className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#3F3F46]" />
                <input
                  type="text"
                  placeholder="e.g. 24h Hackathon, Next.js + Firebase"
                  value={optionalConstraints}
                  onChange={(e) => setOptionalConstraints(e.target.value)}
                  className="w-full bg-[#111113] border border-white/[0.10] hover:border-white/[0.16] focus:border-[#D97706]/60 rounded-xl pl-10 pr-4 py-3 text-sm text-[#FAFAFA] placeholder-[#3F3F46] outline-none transition-colors"
                />
              </div>
            </Field>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2.5 bg-[#D97706] hover:bg-[#F59E0B] text-[#09090B] font-semibold py-3.5 px-6 rounded-xl text-sm transition-all hover:shadow-[0_0_20px_rgba(217,119,6,0.4)]"
        >
          <Sparkles className="w-4 h-4" />
          Generate AI Product Blueprint
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
