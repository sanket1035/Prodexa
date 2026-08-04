"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Project, ValidationRun } from "@/lib/types/schema";
import ScoreRadial from "@/components/dashboard/ScoreRadial";
import ProgressTracker from "@/components/dashboard/ProgressTracker";
import CategoryCard from "@/components/dashboard/CategoryCard";
import IssueRow from "@/components/dashboard/IssueRow";
import RoadmapSection from "@/components/dashboard/RoadmapSection";
import AICofounderTab from "@/components/dashboard/AICofounderTab";
import { generateMarkdownReport, downloadFile } from "@/lib/pdf/exporter";

import {
  RefreshCw, Download, FileCode2, History, TrendingUp,
  Globe, GitBranch, Activity, Lightbulb, Bot,
  CheckCircle2, PlusCircle, Sparkles, X, ChevronRight,
} from "lucide-react";

export default function DashboardPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const projectId = params.projectId as string;
  const runIdParam = searchParams.get("runId");

  const [project, setProject] = useState<Project | null>(null);
  const [currentRun, setCurrentRun] = useState<ValidationRun | null>(null);
  const [previousRun, setPreviousRun] = useState<ValidationRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [revalidating, setRevalidating] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "cofounder">("overview");
  const [showAssetDrawer, setShowAssetDrawer] = useState(false);
  const [inputWebsite, setInputWebsite] = useState("");
  const [inputGithub, setInputGithub] = useState("");
  const [updatingAssets, setUpdatingAssets] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    let intervalId: NodeJS.Timeout | null = null;

    const loadData = async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      try {
        const [pRes, rRes] = await Promise.all([
          fetch(`/api/projects/${projectId}`, { signal: controller.signal }).then((r) => r.json()),
          fetch(`/api/projects/${projectId}/history`, { signal: controller.signal }).then((r) => r.json()),
        ]);

        clearTimeout(timeout);

        if (pRes.success) {
          setProject(pRes.project);
          setInputWebsite(pRes.project.websiteUrl || "");
          setInputGithub(pRes.project.githubRepoUrl || "");
        }

        const runs: ValidationRun[] = rRes.success ? rRes.runs : [];

        if (runs.length > 0) {
          const activeRun = runIdParam ? runs.find((r) => r.id === runIdParam) || runs[0] : runs[0];
          setCurrentRun(activeRun);
          if (runs.length > 1) setPreviousRun(runs[1]);

          if (activeRun && activeRun.status === "running") {
            intervalId = setInterval(async () => {
              const res = await fetch(`/api/validate/${activeRun.id}/status`);
              const data = await res.json();
              if (data.success && data.run) {
                setCurrentRun(data.run);
                if (data.run.status === "completed" || data.run.status === "failed") {
                  if (intervalId) clearInterval(intervalId);
                }
              }
            }, 1500);
          }
        }
      } catch (e: any) {
        clearTimeout(timeout);
        if (e?.name !== "AbortError") console.error(e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [projectId, runIdParam]);

  const handleUpdateAssets = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    setUpdatingAssets(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteUrl: inputWebsite, githubRepoUrl: inputGithub }),
      });
      const data = await res.json();
      if (data.success && data.project) {
        setProject(data.project);
        setShowAssetDrawer(false);
        handleRevalidate();
      }
    } catch (err) { console.error(err); }
    finally { setUpdatingAssets(false); }
  };

  const handleRevalidate = async () => {
    if (!project) return;
    setRevalidating(true);
    try {
      const res = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id, userId: project.userId }),
      });
      const data = await res.json();
      if (data.success && data.runId) router.push(`/dashboard/${project.id}?runId=${data.runId}`);
    } catch (e) { console.error(e); }
    finally { setRevalidating(false); }
  };

  const handleExportMarkdown = () => {
    if (!project || !currentRun) return;
    const md = generateMarkdownReport(project, currentRun);
    downloadFile(`${project.name.toLowerCase().replace(/\s+/g, "-")}-readiness-report.md`, md, "text/markdown");
  };

  const handleExportPdf = () => { if (typeof window !== "undefined") window.print(); };

  // Loading skeleton
  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto w-full">
        <div className="skeleton h-10 w-72 rounded-xl" />
        <div className="skeleton h-6 w-96 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="skeleton h-52 rounded-2xl" />
          <div className="skeleton h-52 md:col-span-2 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-12 text-center space-y-4 animate-fade-in">
        <div className="w-16 h-16 bg-[#18181B] border border-white/[0.08] rounded-2xl flex items-center justify-center mx-auto">
          <Sparkles className="w-7 h-7 text-[#3F3F46]" />
        </div>
        <div className="text-[#A1A1AA] text-sm">Project not found or removed.</div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 bg-[#D97706] hover:bg-[#F59E0B] text-[#09090B] font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
        >
          ← Back to Projects
        </Link>
      </div>
    );
  }

  const isRunning = currentRun?.status === "running";
  const scores = currentRun?.moduleScores;

  const currentOverall = currentRun?.overallScore;
  const previousOverall = previousRun?.overallScore;
  let scoreComparisonText: string | null = null;
  if (currentOverall !== undefined && currentOverall !== null && previousRun && previousOverall !== undefined && previousOverall !== null) {
    const diff = currentOverall - previousOverall;
    const daysAgo = Math.max(1, Math.round((Date.now() - new Date(previousRun.createdAt).getTime()) / (1000 * 3600 * 24)));
    scoreComparisonText = `You were ${previousOverall} ${daysAgo}d ago → Now ${currentOverall} (${diff >= 0 ? `+${diff}` : diff} pts)`;
  }

  let healthScore = project.healthScore || 25;
  if (currentRun?.status === "completed") healthScore = 100;

  const milestoneBadges = [
    { label: "Blueprint Accepted", target: 25, done: healthScore >= 25 },
    { label: "Website Connected", target: 50, done: healthScore >= 50 },
    { label: "GitHub Connected", target: 75, done: healthScore >= 75 },
    { label: "Audit Completed", target: 100, done: healthScore >= 100 },
  ];

  const getScoreColor = (score: number | null) => {
    if (score === null) return "#71717A";
    if (score >= 80) return "#22C55E";
    if (score >= 60) return "#F59E0B";
    return "#EF4444";
  };

  return (
    <div className="p-5 md:p-7 space-y-6 max-w-6xl mx-auto w-full animate-fade-in">
      {/* ── Top Header ── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-semibold text-[#FAFAFA] tracking-tight">
              {project.name || "Untitled Project"}
            </h1>
            <span className="text-[10px] font-mono uppercase tracking-widest bg-[#D97706]/10 text-[#D97706] px-2.5 py-1 rounded-lg border border-[#D97706]/20">
              Launch Report
            </span>
            {project.blueprintId && (
              <Link
                href={`/blueprint/${project.blueprintId}`}
                className="text-[10px] font-mono uppercase bg-[#22C55E]/10 text-[#22C55E] px-2.5 py-1 rounded-lg border border-[#22C55E]/20 flex items-center gap-1 hover:bg-[#22C55E]/20 transition-colors"
              >
                <Lightbulb className="w-3 h-3" />
                Blueprint
              </Link>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-[#71717A] font-mono flex-wrap">
            {project.websiteUrl && (
              <a href={project.websiteUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-[#A1A1AA] transition-colors">
                <Globe className="w-3.5 h-3.5 text-[#D97706]" />
                {project.websiteUrl.replace(/^https?:\/\//, "")}
              </a>
            )}
            {project.githubRepoUrl ? (
              <a href={project.githubRepoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-[#A1A1AA] transition-colors">
                <GitBranch className="w-3.5 h-3.5" />
                {project.githubRepoUrl.replace("https://github.com/", "")}
              </a>
            ) : (
              <button onClick={() => setShowAssetDrawer(true)} className="flex items-center gap-1 text-[#D97706] hover:text-[#F59E0B] transition-colors">
                <PlusCircle className="w-3 h-3" />
                Connect GitHub
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
          <button
            onClick={() => setShowAssetDrawer(!showAssetDrawer)}
            className="flex items-center gap-1.5 bg-[#18181B] hover:bg-[#1C1C1F] border border-white/[0.10] text-[#A1A1AA] hover:text-[#FAFAFA] px-3 py-2 rounded-lg text-xs font-medium transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#D97706]" />
            Assets
          </button>
          <button
            onClick={handleExportMarkdown}
            className="flex items-center gap-1.5 bg-[#18181B] hover:bg-[#1C1C1F] border border-white/[0.10] text-[#A1A1AA] hover:text-[#FAFAFA] px-3 py-2 rounded-lg text-xs font-medium transition-all"
          >
            <FileCode2 className="w-3.5 h-3.5 text-[#22C55E]" />
            Export
          </button>
          <button
            onClick={handleRevalidate}
            disabled={revalidating || isRunning}
            className="flex items-center gap-1.5 bg-[#D97706] hover:bg-[#F59E0B] text-[#09090B] px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:shadow-[0_0_12px_rgba(217,119,6,0.3)] disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${revalidating || isRunning ? "animate-spin" : ""}`} />
            Run Audit
          </button>
        </div>
      </div>

      {/* ── Product Health Milestone Bar ── */}
      <div className="bg-[#111113] border border-white/[0.08] rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#22C55E]" />
            <span className="text-sm font-semibold text-[#FAFAFA]">Product Health</span>
          </div>
          <span className="text-sm font-bold text-[#22C55E] font-mono">{healthScore}%</span>
        </div>
        <div className="w-full bg-[#27272A] rounded-full h-2 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${healthScore}%`,
              background: "linear-gradient(90deg, #D97706, #22C55E)",
            }}
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {milestoneBadges.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs transition-all ${
                m.done
                  ? "bg-[#22C55E]/8 border-[#22C55E]/20 text-[#22C55E]"
                  : "bg-[#18181B] border-white/[0.06] text-[#3F3F46]"
              }`}
            >
              <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 ${m.done ? "text-[#22C55E]" : "text-[#3F3F46]"}`} />
              <span className="font-medium truncate">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Asset Connector Drawer ── */}
      {showAssetDrawer && (
        <form onSubmit={handleUpdateAssets} className="bg-[#111113] border border-[#D97706]/30 rounded-2xl p-5 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.07]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D97706]" />
              <h3 className="text-sm font-semibold text-[#FAFAFA]">Connect Project Assets</h3>
            </div>
            <button type="button" onClick={() => setShowAssetDrawer(false)} className="text-[#71717A] hover:text-[#FAFAFA] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#A1A1AA]">Landing Page URL</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#3F3F46]" />
                <input
                  type="url"
                  required
                  placeholder="https://your-landing-page.com"
                  value={inputWebsite}
                  onChange={(e) => setInputWebsite(e.target.value)}
                  className="w-full bg-[#18181B] border border-white/[0.10] focus:border-[#D97706]/60 rounded-xl pl-9 pr-3 py-2.5 text-sm text-[#FAFAFA] placeholder-[#3F3F46] outline-none transition-colors font-mono"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#A1A1AA]">GitHub Repository URL</label>
              <div className="relative">
                <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#3F3F46]" />
                <input
                  type="url"
                  placeholder="https://github.com/username/repo"
                  value={inputGithub}
                  onChange={(e) => setInputGithub(e.target.value)}
                  className="w-full bg-[#18181B] border border-white/[0.10] focus:border-[#D97706]/60 rounded-xl pl-9 pr-3 py-2.5 text-sm text-[#FAFAFA] placeholder-[#3F3F46] outline-none transition-colors font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updatingAssets}
              className="flex items-center gap-2 bg-[#D97706] hover:bg-[#F59E0B] text-[#09090B] font-semibold text-xs px-4 py-2.5 rounded-xl transition-all disabled:opacity-50"
            >
              {updatingAssets ? "Saving..." : "Save & Run Audit"}
            </button>
          </div>
        </form>
      )}

      {/* ── Main Tab Navigation ── */}
      <div className="border-b border-white/[0.08] flex items-center gap-1">
        {[
          { id: "overview" as const, label: "Readiness Report", icon: Activity },
          { id: "cofounder" as const, label: "AI Co-Founder", icon: Bot, badge: "AI" },
        ].map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-medium transition-all relative ${
              activeTab === id
                ? "text-[#FAFAFA]"
                : "text-[#71717A] hover:text-[#A1A1AA]"
            }`}
          >
            {activeTab === id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D97706] rounded-t-full" />
            )}
            <Icon className={`w-3.5 h-3.5 ${id === "cofounder" ? "text-[#22C55E]" : activeTab === id ? "text-[#D97706]" : ""}`} />
            {label}
            {badge && (
              <span className="text-[9px] font-mono bg-[#22C55E]/15 text-[#22C55E] px-1.5 py-0.5 rounded-md">{badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── TAB: AI CO-FOUNDER ── */}
      {activeTab === "cofounder" && (
        <AICofounderTab
          projectId={project.id}
          projectName={project.name}
          healthScore={healthScore}
          readinessScore={currentRun?.overallScore ?? null}
        />
      )}

      {/* ── TAB: OVERVIEW ── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Score Improvement Banner */}
          {scoreComparisonText && (
            <div className="bg-[#22C55E]/8 border border-[#22C55E]/20 text-[#22C55E] rounded-xl p-3.5 text-xs font-mono flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>{scoreComparisonText}</span>
              </div>
              <Link href={`/dashboard/${project.id}/history`} className="underline font-semibold hover:text-[#4ADE80] transition-colors">
                View Trend
              </Link>
            </div>
          )}

          {/* Score Hero + Pipeline Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Score Card */}
            <div className="bg-[#111113] border border-white/[0.08] rounded-2xl p-6 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="text-xs font-medium text-[#71717A] uppercase tracking-widest">Launch Score</div>
              <ScoreRadial score={currentRun?.overallScore ?? null} size={140} strokeWidth={5} />
              <div className="text-xs text-[#71717A] max-w-[180px] leading-relaxed">
                {currentRun?.overallScore !== null
                  ? "Deterministic score across 6 analysis modules"
                  : "Run a launch audit to compute your score"}
              </div>
            </div>

            {/* Pipeline Summary */}
            <div className="md:col-span-2">
              {isRunning ? (
                <ProgressTracker
                  currentModule={currentRun?.currentModule ?? null}
                  status={currentRun?.status ?? "pending"}
                />
              ) : (
                <div className="bg-[#111113] border border-white/[0.08] rounded-2xl p-6 h-full space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[#FAFAFA]">Analysis Summary</h3>
                    {currentRun?.status === "completed" && (
                      <span className="text-[10px] font-mono uppercase text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/20 px-2.5 py-1 rounded-lg">
                        Completed
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: "Issues Found", value: currentRun?.issues?.length || 0, color: "#A1A1AA" },
                      { label: "Critical Gaps", value: currentRun?.issues?.filter((i) => i.severity === "critical").length || 0, color: "#EF4444" },
                      { label: "Roadmap Tasks", value: currentRun?.roadmap?.length || 0, color: "#D97706" },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-[#18181B] border border-white/[0.07] rounded-xl p-3.5 text-center">
                        <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
                        <div className="text-[11px] text-[#71717A] mt-1">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-[#71717A] leading-relaxed">
                    {currentRun
                      ? "All 6 modules executed deterministically. Review prioritized issues below and use Copy Fix to resolve gaps."
                      : "No audit run yet. Click Run Audit to analyze your product across 6 specialized readiness modules."}
                  </p>

                  {!currentRun && (
                    <button
                      onClick={handleRevalidate}
                      disabled={revalidating}
                      className="flex items-center gap-2 bg-[#D97706] hover:bg-[#F59E0B] text-[#09090B] font-semibold text-xs px-4 py-2.5 rounded-xl transition-all hover:shadow-[0_0_12px_rgba(217,119,6,0.3)] disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${revalidating ? "animate-spin" : ""}`} />
                      {revalidating ? "Starting..." : "Run First Audit"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 6 Module Score Cards */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#FAFAFA]">Module Scores</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <CategoryCard
                title="Product Understanding"
                score={scores?.productUnderstanding ?? null}
                status={currentRun?.moduleStatus?.productUnderstanding?.status}
                reason={currentRun?.moduleStatus?.productUnderstanding?.reason}
                description="Value prop positioning, meta tags, and target audience definition."
              />
              <CategoryCard
                title="Engineering Analysis"
                score={scores?.engineering ?? null}
                status={currentRun?.moduleStatus?.engineering?.status}
                reason={currentRun?.moduleStatus?.engineering?.reason}
                description="GitHub metadata, LICENSE, README completeness, and commit health."
              />
              <CategoryCard
                title="UX Validation"
                score={scores?.ux ?? null}
                status={currentRun?.moduleStatus?.ux?.status}
                reason={currentRun?.moduleStatus?.ux?.reason}
                description="Mobile viewport, primary CTA visibility, and heading hierarchy."
              />
              <CategoryCard
                title="Performance Audit"
                score={scores?.performance ?? null}
                status={currentRun?.moduleStatus?.performance?.status}
                reason={currentRun?.moduleStatus?.performance?.reason}
                description="Latency timings, server response, and script overhead."
              />
              <CategoryCard
                title="Business Review"
                score={scores?.business ?? null}
                status={currentRun?.moduleStatus?.business?.status}
                reason={currentRun?.moduleStatus?.business?.reason}
                description="Pricing clarity, contact transparency, and market differentiation."
              />
              <CategoryCard
                title="Launch Planner"
                score={currentRun?.overallScore ?? null}
                status="completed"
                description="Prioritized effort-reward roadmap across all modules."
              />
            </div>
          </div>

          {/* Issues */}
          {currentRun && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#FAFAFA]">
                  Prioritized Gaps &amp; Fixes
                  {currentRun.issues?.length > 0 && (
                    <span className="ml-2 text-[11px] font-mono text-[#71717A] bg-white/[0.05] px-2 py-0.5 rounded-lg">
                      {currentRun.issues.length}
                    </span>
                  )}
                </h3>
              </div>

              {currentRun.issues?.length === 0 ? (
                <div className="bg-[#111113] border border-[#22C55E]/20 rounded-2xl p-8 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-[#22C55E] mx-auto" />
                  <div className="text-sm font-semibold text-[#22C55E]">Zero critical gaps detected!</div>
                  <div className="text-xs text-[#71717A]">Your product is launch-ready.</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {currentRun.issues.map((issue) => (
                    <IssueRow key={issue.id} issue={issue} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Roadmap */}
          {currentRun?.roadmap && currentRun.roadmap.length > 0 && (
            <RoadmapSection items={currentRun.roadmap} />
          )}
        </div>
      )}
    </div>
  );
}
