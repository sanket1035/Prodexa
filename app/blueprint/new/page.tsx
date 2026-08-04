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
    <label className="block text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
      {optional && <span className="ml-1" style={{ color: "var(--text-faint)" }}>(optional)</span>}
    </label>
    {children}
    {hint && <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{hint}</p>}
  </div>
);

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
        <div className="max-w-md w-full card p-8 space-y-6 anim-fade">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(217,119,6,0.12)", border: "1px solid rgba(217,119,6,0.2)" }}>
              <Loader2 className="w-5 h-5 anim-spin" style={{ color: "var(--accent)" }} />
            </div>
            <div>
              <h3 className="text-base font-semibold" style={{ color: "var(--text)" }}>Generating Blueprint</h3>
              <p className="text-xs font-mono mt-0.5" style={{ color: "var(--accent)" }}>{STEPS[stepIndex]}</p>
            </div>
          </div>

          <div className="space-y-2.5 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
            {STEPS.map((st, idx) => (
              <div key={idx} className="flex items-center gap-2.5 text-xs transition-all" style={{
                color: idx < stepIndex ? "var(--success)" : idx === stepIndex ? "var(--text)" : "var(--text-faint)"
              }}>
                {idx < stepIndex ? (
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-green-500" />
                ) : idx === stepIndex ? (
                  <Loader2 className="w-3.5 h-3.5 anim-spin flex-shrink-0" style={{ color: "var(--accent)" }} />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border flex-shrink-0" style={{ borderColor: "var(--border)" }} />
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
    <div className="p-6 md:p-8 max-w-3xl mx-auto w-full space-y-8 anim-fade">
      {/* Header */}
      <div>
        <div className="badge badge-amber font-mono text-[10px] uppercase mb-4">
          <Lightbulb className="w-3 h-3" />
          Option A — New Idea
        </div>
        <h1 className="text-2xl font-semibold tracking-tight mb-2" style={{ color: "var(--text)" }}>
          Generate AI Product Blueprint
        </h1>
        <p className="text-sm leading-relaxed max-w-lg" style={{ color: "var(--text-muted)" }}>
          Turn your Day 0 idea into structured startup documentation — Quality Score, competitor analysis, system architecture, and tech stack recommendation in under 15 seconds.
        </p>
      </div>

      {error && (
        <div className="badge badge-red p-4 text-sm flex items-start gap-3 w-full">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Section: Project Basics */}
        <div className="card p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
            <Lightbulb className="w-4 h-4" style={{ color: "var(--accent)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>Project Basics</span>
          </div>

          <Field label="Project Name" required hint="What is this product called?">
            <input
              type="text"
              required
              placeholder="e.g. ContractGuard AI"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
            />
          </Field>

          <Field label="Idea Description" required hint="Describe what your product does and how it creates value for users.">
            <textarea
              rows={3}
              required
              placeholder="Describe what your product does and how it creates value for users..."
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              className="input textarea"
            />
          </Field>

          <Field label="Problem Statement" required hint="What painful problem are you solving? Who suffers from this gap?">
            <textarea
              rows={3}
              required
              placeholder="What painful problem are you solving? Who suffers from this gap?"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              className="input textarea"
            />
          </Field>
        </div>

        {/* Section: Audience & Context */}
        <div className="card p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
            <Users className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>Audience &amp; Context</span>
            <span className="text-xs font-mono ml-auto" style={{ color: "var(--text-faint)" }}>optional</span>
          </div>

          <Field label="Target Audience / ICP" optional>
            <input
              type="text"
              placeholder="e.g. Freelance designers, early-stage SaaS founders"
              value={targetUsers}
              onChange={(e) => setTargetUsers(e.target.value)}
              className="input"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Industry" optional>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "var(--text-faint)" }} />
                <input
                  type="text"
                  placeholder="e.g. Developer Tools, FinTech"
                  value={optionalIndustry}
                  onChange={(e) => setOptionalIndustry(e.target.value)}
                  className="input pl-9"
                />
              </div>
            </Field>

            <Field label="Build Constraints" optional>
              <div className="relative">
                <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "var(--text-faint)" }} />
                <input
                  type="text"
                  placeholder="e.g. 24h Hackathon, Next.js + Firebase"
                  value={optionalConstraints}
                  onChange={(e) => setOptionalConstraints(e.target.value)}
                  className="input pl-9"
                />
              </div>
            </Field>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="btn btn-primary btn-lg w-full"
        >
          <Sparkles className="w-4 h-4" />
          Generate AI Product Blueprint
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
