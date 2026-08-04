"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Globe, GitBranch, ArrowRight, AlertCircle, Sparkles, CheckCircle2, Loader2, FileText } from "lucide-react";

const STEPS = [
  "Analyzing Problem & Solution Statement...",
  "Evaluating Competitor Landscape & Market Gaps...",
  "Structuring Core MVP Feature Architecture...",
  "Recommending Production Tech Stack & Risk Matrix...",
  "Designing Firestore Database & API Payload Contract...",
  "Computing Blueprint Quality Score & Mermaid System Diagram...",
];

export default function NewProjectPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [githubRepoUrl, setGithubRepoUrl] = useState("");
  const [pitchDeckText, setPitchDeckText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!websiteUrl) {
      setError("Website URL is required for pre-launch validation");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || undefined,
          websiteUrl,
          githubRepoUrl: githubRepoUrl || undefined,
          userId: user?.uid || "demo-user-123",
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || data.errors?.[0]?.message || "Failed to create project");
      }

      const projectId = data.project.id;

      const valRes = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          userId: user?.uid || "demo-user-123",
          pitchDeckText: pitchDeckText || undefined,
        }),
      });

      const valData = await valRes.json();
      const runId = valData.runId;

      router.push(`/dashboard/${projectId}?runId=${runId || ""}`);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-sm w-full bg-[#111113] border border-white/[0.08] rounded-2xl p-8 space-y-6 text-center animate-fade-in">
          <div className="w-14 h-14 bg-[#D97706]/10 border border-[#D97706]/20 rounded-2xl flex items-center justify-center mx-auto">
            <Loader2 className="w-6 h-6 text-[#D97706] animate-spin" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#FAFAFA] mb-1">Initializing Analysis</h3>
            <p className="text-xs text-[#71717A] font-mono">Running 6 readiness modules...</p>
          </div>
          <div className="space-y-2.5 text-left pt-2 border-t border-white/[0.08]">
            {STEPS.map((st, idx) => (
              <div key={idx} className="flex items-center gap-2.5 text-xs">
                <div className="flex-shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#D97706] animate-pulse" />
                </div>
                <span className="text-[#71717A] font-mono">{st.replace("...", "")}</span>
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
          <Sparkles className="w-3 h-3" />
          Option B — Launch Audit
        </div>
        <h1 className="text-2xl font-semibold text-[#FAFAFA] tracking-tight mb-2">
          Validate Your Product
        </h1>
        <p className="text-sm text-[#71717A] leading-relaxed max-w-lg">
          Submit your website URL and GitHub repo to run 6 deterministic readiness analysis modules with copy-pasteable fixes.
        </p>
      </div>

      {error && (
        <div className="bg-[#EF4444]/8 border border-[#EF4444]/20 text-[#EF4444] rounded-xl p-4 text-sm flex items-start gap-3 animate-fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Project Name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-[#A1A1AA]">
            Project Name <span className="text-[#3F3F46]">(optional — auto-detected from URL)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Pramana AI"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#111113] border border-white/[0.10] hover:border-white/[0.16] focus:border-[#D97706]/60 rounded-xl px-4 py-3 text-sm text-[#FAFAFA] placeholder-[#3F3F46] outline-none transition-colors"
          />
        </div>

        {/* Website URL */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-[#A1A1AA]">
            Website / Landing Page URL <span className="text-[#EF4444]">*</span>
          </label>
          <div className="relative">
            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3F3F46]" />
            <input
              type="url"
              required
              placeholder="https://your-landing-page.com"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              className="w-full bg-[#111113] border border-white/[0.10] hover:border-white/[0.16] focus:border-[#D97706]/60 rounded-xl pl-10 pr-4 py-3 text-sm text-[#FAFAFA] placeholder-[#3F3F46] outline-none transition-colors font-mono"
            />
          </div>
          <p className="text-xs text-[#71717A]">
            Scraped for CTA contrast, meta tags, value prop positioning, and Lighthouse performance.
          </p>
        </div>

        {/* GitHub Repo URL */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-[#A1A1AA]">
            GitHub Repository URL <span className="text-[#3F3F46]">(recommended)</span>
          </label>
          <div className="relative">
            <GitBranch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3F3F46]" />
            <input
              type="url"
              placeholder="https://github.com/owner/repo"
              value={githubRepoUrl}
              onChange={(e) => setGithubRepoUrl(e.target.value)}
              className="w-full bg-[#111113] border border-white/[0.10] hover:border-white/[0.16] focus:border-[#D97706]/60 rounded-xl pl-10 pr-4 py-3 text-sm text-[#FAFAFA] placeholder-[#3F3F46] outline-none transition-colors font-mono"
            />
          </div>
          <p className="text-xs text-[#71717A]">
            Checked read-only for README structure, LICENSE presence, commit freshness, and package manifest.
          </p>
        </div>

        {/* Pitch Deck Notes */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-[#A1A1AA] flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            Pitch Deck / Notes <span className="text-[#3F3F46]">(optional — improves Business Review)</span>
          </label>
          <textarea
            rows={3}
            placeholder="Paste value proposition, market sizing, target customer, or pitch text..."
            value={pitchDeckText}
            onChange={(e) => setPitchDeckText(e.target.value)}
            className="w-full bg-[#111113] border border-white/[0.10] hover:border-white/[0.16] focus:border-[#D97706]/60 rounded-xl px-4 py-3 text-sm text-[#FAFAFA] placeholder-[#3F3F46] outline-none transition-colors resize-none"
          />
        </div>

        {/* What Gets Analyzed */}
        <div className="bg-[#111113] border border-white/[0.07] rounded-xl p-4">
          <div className="text-xs font-medium text-[#71717A] mb-3">6 Analysis Modules</div>
          <div className="grid grid-cols-2 gap-2">
            {["Product Understanding", "Engineering Quality", "UX & Design", "Performance", "Accessibility", "Business Viability"].map((m) => (
              <div key={m} className="flex items-center gap-2 text-xs text-[#A1A1AA]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E] flex-shrink-0" />
                {m}
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2.5 bg-[#D97706] hover:bg-[#F59E0B] text-[#09090B] font-semibold py-3.5 px-6 rounded-xl text-sm transition-all hover:shadow-[0_0_20px_rgba(217,119,6,0.4)]"
        >
          <Sparkles className="w-4 h-4" />
          Run Launch Audit
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
