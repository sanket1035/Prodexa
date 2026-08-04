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
        <div className="max-w-sm w-full card p-8 space-y-6 text-center anim-fade">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto" style={{ background: "rgba(217,119,6,0.12)", border: "1px solid rgba(217,119,6,0.2)" }}>
            <Loader2 className="w-6 h-6 anim-spin" style={{ color: "var(--accent)" }} />
          </div>
          <div>
            <h3 className="text-base font-semibold" style={{ color: "var(--text)" }}>Initializing Analysis</h3>
            <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>Running 6 readiness modules...</p>
          </div>
          <div className="space-y-2.5 text-left pt-2 border-t" style={{ borderColor: "var(--border)" }}>
            {STEPS.map((st, idx) => (
              <div key={idx} className="flex items-center gap-2.5 text-xs">
                <div className="w-1.5 h-1.5 rounded-full anim-pulse flex-shrink-0" style={{ background: "var(--accent)" }} />
                <span className="font-mono" style={{ color: "var(--text-muted)" }}>{st.replace("...", "")}</span>
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
          <Sparkles className="w-3 h-3" />
          Option B — Launch Audit
        </div>
        <h1 className="text-2xl font-semibold tracking-tight mb-2" style={{ color: "var(--text)" }}>
          Validate Your Product
        </h1>
        <p className="text-sm leading-relaxed max-w-lg" style={{ color: "var(--text-muted)" }}>
          Submit your website URL and GitHub repo to run 6 deterministic readiness analysis modules with copy-pasteable fixes.
        </p>
      </div>

      {error && (
        <div className="badge badge-red p-4 text-sm flex items-start gap-3 w-full">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Project Name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
            Project Name <span style={{ color: "var(--text-faint)" }}>(optional — auto-detected from URL)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Pramana AI"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
          />
        </div>

        {/* Website URL */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
            Website / Landing Page URL <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-faint)" }} />
            <input
              type="url"
              required
              placeholder="https://your-landing-page.com"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              className="input pl-10 font-mono"
            />
          </div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Scraped for CTA contrast, meta tags, value prop positioning, and Lighthouse performance.
          </p>
        </div>

        {/* GitHub Repo URL */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
            GitHub Repository URL <span style={{ color: "var(--text-faint)" }}>(recommended)</span>
          </label>
          <div className="relative">
            <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-faint)" }} />
            <input
              type="url"
              placeholder="https://github.com/owner/repo"
              value={githubRepoUrl}
              onChange={(e) => setGithubRepoUrl(e.target.value)}
              className="input pl-10 font-mono"
            />
          </div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Checked read-only for README structure, LICENSE presence, commit freshness, and package manifest.
          </p>
        </div>

        {/* Pitch Deck Notes */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
            <FileText className="w-3.5 h-3.5" />
            Pitch Deck / Notes <span style={{ color: "var(--text-faint)" }}>(optional)</span>
          </label>
          <textarea
            rows={3}
            placeholder="Paste value proposition, market sizing, target customer, or pitch text..."
            value={pitchDeckText}
            onChange={(e) => setPitchDeckText(e.target.value)}
            className="input textarea"
          />
        </div>

        {/* What Gets Analyzed */}
        <div className="card p-4 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>6 Analysis Modules</div>
          <div className="grid grid-cols-2 gap-2">
            {["Product Understanding", "Engineering Quality", "UX & Design", "Performance", "Accessibility", "Business Viability"].map((m) => (
              <div key={m} className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                {m}
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="btn btn-primary btn-lg w-full"
        >
          <Sparkles className="w-4 h-4" />
          Run Launch Audit
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
