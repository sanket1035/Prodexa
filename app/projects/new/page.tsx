"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Globe, GitBranch, ArrowRight, AlertCircle, Sparkles } from "lucide-react";

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
      // 1. Create project
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

      // 2. Trigger validation run
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

      // 3. Redirect to dashboard with active run status
      router.push(`/dashboard/${projectId}?runId=${runId || ""}`);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during submission");
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto w-full space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-mono tracking-wider uppercase text-[#D97B3F] bg-[#D97B3F]/10 px-2.5 py-1 rounded-[4px] border border-[#D97B3F]/20 mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          Module Submission
        </div>
        <h1 className="text-2xl font-medium text-[#EDEDEF] tracking-tight">
          Validate New Product
        </h1>
        <p className="text-sm text-[#8B8F97] mt-1">
          Submit target URLs and metadata to initiate 6 deterministic readiness analysis modules.
        </p>
      </div>

      {error && (
        <div className="bg-[#C25A4D]/10 border border-[#C25A4D]/30 text-[#C25A4D] rounded-[6px] p-4 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-[#16181B] border border-[#2A2D31] rounded-[6px] p-6 space-y-6">
        {/* Project Name */}
        <div className="space-y-2">
          <label className="block text-xs font-mono uppercase tracking-wider text-[#EDEDEF]">
            Project Name <span className="text-[#8B8F97] font-sans normal-case">(optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Prodexa AI"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#0B0C0E] border border-[#2A2D31] rounded-[6px] px-3.5 py-2.5 text-sm text-[#EDEDEF] placeholder-[#8B8F97]/50 focus:border-[#D97B3F] outline-none transition-colors"
          />
        </div>

        {/* Website URL */}
        <div className="space-y-2">
          <label className="block text-xs font-mono uppercase tracking-wider text-[#EDEDEF]">
            Website / Landing Page URL <span className="text-[#D97B3F]">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8B8F97]">
              <Globe className="w-4 h-4" />
            </div>
            <input
              type="url"
              required
              placeholder="https://your-landing-page.com"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              className="w-full bg-[#0B0C0E] border border-[#2A2D31] rounded-[6px] pl-10 pr-3.5 py-2.5 text-sm text-[#EDEDEF] placeholder-[#8B8F97]/50 focus:border-[#D97B3F] outline-none transition-colors font-mono"
            />
          </div>
          <p className="text-xs text-[#8B8F97]">
            Scraped for CTA contrast, meta tags, value prop positioning, and Lighthouse performance.
          </p>
        </div>

        {/* GitHub Repo URL */}
        <div className="space-y-2">
          <label className="block text-xs font-mono uppercase tracking-wider text-[#EDEDEF]">
            GitHub Repository URL <span className="text-[#8B8F97] font-sans normal-case">(Recommended for Engineering Analysis)</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8B8F97]">
              <GitBranch className="w-4 h-4" />
            </div>
            <input
              type="url"
              placeholder="https://github.com/owner/repo"
              value={githubRepoUrl}
              onChange={(e) => setGithubRepoUrl(e.target.value)}
              className="w-full bg-[#0B0C0E] border border-[#2A2D31] rounded-[6px] pl-10 pr-3.5 py-2.5 text-sm text-[#EDEDEF] placeholder-[#8B8F97]/50 focus:border-[#D97B3F] outline-none transition-colors font-mono"
            />
          </div>
          <p className="text-xs text-[#8B8F97]">
            Checked read-only for README structure, LICENSE presence, commit freshness, and package manifest.
          </p>
        </div>

        {/* Optional Pitch Deck Notes / Text */}
        <div className="space-y-2">
          <label className="block text-xs font-mono uppercase tracking-wider text-[#EDEDEF]">
            Pitch Deck Summary / Notes <span className="text-[#8B8F97] font-sans normal-case">(optional for Business Review)</span>
          </label>
          <div className="relative">
            <textarea
              rows={3}
              placeholder="Paste value proposition, market sizing, target customer, or pitch text..."
              value={pitchDeckText}
              onChange={(e) => setPitchDeckText(e.target.value)}
              className="w-full bg-[#0B0C0E] border border-[#2A2D31] rounded-[6px] p-3 text-sm text-[#EDEDEF] placeholder-[#8B8F97]/50 focus:border-[#D97B3F] outline-none transition-colors"
            />
          </div>
        </div>

        {/* Submit CTA */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#D97B3F] hover:bg-[#E88A4E] text-[#0B0C0E] font-medium py-3 px-6 rounded-[6px] text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[#D97B3F]"
          >
            {loading ? (
              <span className="font-mono text-sm">Initiating Analysis Pipeline...</span>
            ) : (
              <>
                Validate Product
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
