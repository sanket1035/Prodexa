"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Project, ValidationRun } from "@/lib/types/schema";
import ScoreRadial from "@/components/dashboard/ScoreRadial";
import ProgressTracker, { AuditPipelineViewer } from "@/components/dashboard/ProgressTracker";
import CategoryCard from "@/components/dashboard/CategoryCard";
import IssueRow from "@/components/dashboard/IssueRow";
import RoadmapSection from "@/components/dashboard/RoadmapSection";
import AICofounderTab from "@/components/dashboard/AICofounderTab";
import { generateMarkdownReport, downloadFile } from "@/lib/pdf/exporter";
import { useAuth } from "@/lib/auth/AuthContext";

import {
  RefreshCw, FileCode2, FileText, TrendingUp,
  Globe, GitBranch, Activity, Lightbulb, Bot,
  CheckCircle2, AlertCircle, PlusCircle, Sparkles, X,
} from "lucide-react";

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto w-full">
        <div className="skeleton h-10 w-72 rounded-xl" />
        <div className="skeleton h-6 w-96 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="skeleton h-52 rounded-2xl" />
          <div className="skeleton h-52 md:col-span-2 rounded-2xl" />
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const { user } = useAuth();
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
  const [isAuditExecuting, setIsAuditExecuting] = useState(false);
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
      const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout for cold Firestore start

      // Instant load from localStorage cache
      if (typeof window !== "undefined") {
        const cachedStr = localStorage.getItem(`prodexa_proj_${projectId}`);
        if (cachedStr) {
          try {
            const cachedProj = JSON.parse(cachedStr);
            if (cachedProj && cachedProj.id) {
              setProject(cachedProj);
              const rawUrl = cachedProj.websiteUrl || "";
              const isPlaceholder = rawUrl.includes("example-landing-page.com") || rawUrl === "https://example.com";
              setInputWebsite(isPlaceholder ? "" : rawUrl);
              setInputGithub(cachedProj.githubRepoUrl || "");
              setLoading(false);
            }
          } catch (e) {
            // ignore
          }
        }
      }

      try {
        const [pRes, rRes] = await Promise.all([
          fetch(`/api/projects/${projectId}`, { signal: controller.signal }).then((r) => r.json()),
          fetch(`/api/projects/${projectId}/history`, { signal: controller.signal }).then((r) => r.json()),
        ]);

        clearTimeout(timeout);

        if (pRes.success) {
          setProject(pRes.project);
          if (typeof window !== "undefined") {
            localStorage.setItem(`prodexa_proj_${projectId}`, JSON.stringify(pRes.project));
          }
          const rawUrl = pRes.project.websiteUrl || "";
          const isPlaceholder = rawUrl.includes("example-landing-page.com") || rawUrl === "https://example.com";
          setInputWebsite(isPlaceholder ? "" : rawUrl);
          setInputGithub(pRes.project.githubRepoUrl || "");
        }

        let runs: ValidationRun[] = rRes.success && Array.isArray(rRes.runs) ? rRes.runs : [];
        if (runs.length === 0 && typeof window !== "undefined") {
          const cachedRunsStr = localStorage.getItem(`prodexa_runs_${projectId}`);
          if (cachedRunsStr) {
            try {
              const cachedRuns = JSON.parse(cachedRunsStr);
              if (Array.isArray(cachedRuns) && cachedRuns.length > 0) runs = cachedRuns;
            } catch {
              // ignore
            }
          }
        }

        if (runs.length > 0) {
          if (typeof window !== "undefined") {
            localStorage.setItem(`prodexa_runs_${projectId}`, JSON.stringify(runs));
          }
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
        await handleRevalidate(inputWebsite, inputGithub);
      }
    } catch (err) { console.error(err); }
    finally { setUpdatingAssets(false); }
  };

  const handleRevalidate = async (webUrlOverride?: string, ghUrlOverride?: string) => {
    if (!project) return;
    setRevalidating(true);
    setIsAuditExecuting(true);
    try {
      const targetWebUrl = typeof webUrlOverride === "string" ? webUrlOverride : (project.websiteUrl || inputWebsite || null);
      const targetGhUrl = typeof ghUrlOverride === "string" ? ghUrlOverride : (project.githubRepoUrl || inputGithub || null);

      const res = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          userId: project.userId || "demo-user-123",
          websiteUrl: targetWebUrl,
          githubRepoUrl: targetGhUrl,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        console.error("Audit error:", data.message);
        setIsAuditExecuting(false);
        setRevalidating(false);
        return;
      }
      if (data.success && data.runId) {
        if (data.run) {
          setCurrentRun(data.run);
        }
        if (data.project) {
          setProject(data.project);
          const rawUrl = data.project.websiteUrl || "";
          const isPlaceholder = rawUrl.includes("example-landing-page.com") || rawUrl === "https://example.com";
          setInputWebsite(isPlaceholder ? "" : rawUrl);
          setInputGithub(data.project.githubRepoUrl || "");
          if (typeof window !== "undefined" && user) {
            const userCached = localStorage.getItem(`prodexa_projects_${user.uid}`);
            if (userCached) {
              try {
                const parsed: Project[] = JSON.parse(userCached);
                const updated = parsed.map((p) => (p.id === data.project.id ? data.project : p));
                localStorage.setItem(`prodexa_projects_${user.uid}`, JSON.stringify(updated));
              } catch {
                // ignore
              }
            }
          }
        }
        // Immediately sync cached runs in localStorage so history and dashboard update instantly
        if (typeof window !== "undefined" && data.run) {
          const cachedRunsStr = localStorage.getItem(`prodexa_runs_${project.id}`);
          let runsList: ValidationRun[] = [];
          if (cachedRunsStr) {
            try { runsList = JSON.parse(cachedRunsStr); } catch {}
          }
          runsList = [data.run, ...runsList.filter((r) => r.id !== data.run.id)];
          localStorage.setItem(`prodexa_runs_${project.id}`, JSON.stringify(runsList));
        }
        router.push(`/dashboard/${project.id}?runId=${data.runId}`);
      }
    } catch (e) { console.error(e); }
    finally { setRevalidating(false); }
  };

  const handleExportPDF = () => {
    if (!project || !currentRun) return;
    // Trigger browser print/save-to-pdf dialog cleanly
    window.print();
  };

  const handleExportMarkdown = () => {
    if (!project || !currentRun) return;
    const md = generateMarkdownReport(project, currentRun);
    downloadFile(`${project.name.toLowerCase().replace(/\s+/g, "-")}-readiness-report.md`, md, "text/markdown");
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto w-full">
        <div className="skeleton h-10 w-72 rounded-xl" />
        <div className="skeleton h-6 w-96 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="skeleton h-52 rounded-2xl" />
          <div className="skeleton h-52 md:col-span-2 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-12 text-center space-y-4 anim-fade">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <Sparkles className="w-7 h-7" style={{ color: "var(--text-faint)" }} />
        </div>
        <div className="text-sm" style={{ color: "var(--text-muted)" }}>Project not found or removed.</div>
        <Link href="/projects" className="btn btn-primary">
          ← Back to Projects
        </Link>
      </div>
    );
  }

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
  const prodStatus = currentRun?.moduleStatus?.productUnderstanding?.status;
  const engStatus = currentRun?.moduleStatus?.engineering?.status;

  const webOk = Boolean(project.websiteUrl) && prodStatus !== "failed";
  const ghOk = Boolean(project.githubRepoUrl) && engStatus !== "failed";

  if (currentRun?.status === "completed") {
    healthScore = (!webOk && !ghOk) ? 35 : (!webOk || (project.githubRepoUrl && !ghOk)) ? 60 : 100;
  }

  const milestoneBadges = [
    { label: project.blueprintId ? "Blueprint Created" : "Direct Launch Audit", done: Boolean(project.blueprintId || currentRun), failed: false },
    { label: webOk ? "Website Connected" : (project.websiteUrl ? "Website Offline (404)" : "Website Optional"), done: webOk, failed: Boolean(project.websiteUrl) && !webOk },
    { label: ghOk ? "GitHub Connected" : (project.githubRepoUrl ? "GitHub Not Found (404)" : "GitHub Optional"), done: ghOk, failed: Boolean(project.githubRepoUrl) && !ghOk },
    { label: currentRun?.status === "completed" ? "Audit Completed" : "Audit Pending", done: currentRun?.status === "completed", failed: false },
  ];

  const isRunning = currentRun?.status === "running";

  return (
    <div className="p-5 md:p-7 space-y-6 max-w-6xl mx-auto w-full anim-fade">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b pb-5" style={{ borderColor: "var(--border)" }}>
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text)" }}>
              {project.name || "Untitled Project"}
            </h1>
            <span className="badge badge-amber font-mono text-[10px] uppercase">
              Launch Report
            </span>
            {project.blueprintId && (
              <Link
                href={`/blueprint/${project.blueprintId}`}
                className="badge badge-green text-[10px] uppercase font-mono flex items-center gap-1"
                style={{ textDecoration: "none" }}
              >
                <Lightbulb className="w-3 h-3" />
                Blueprint
              </Link>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs font-mono flex-wrap" style={{ color: "var(--text-muted)" }}>
            {project.websiteUrl && !project.websiteUrl.includes("github.com") && project.websiteUrl !== "https://example-landing-page.com" ? (
              <a href={project.websiteUrl.startsWith("http") ? project.websiteUrl : `https://${project.websiteUrl}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:underline text-amber-500">
                <Globe className="w-3.5 h-3.5" />
                <span>{project.websiteUrl.replace(/^https?:\/\//, "")}</span>
              </a>
            ) : (
              <button onClick={() => setShowAssetDrawer(true)} className="flex items-center gap-1 text-amber-500 hover:underline">
                <Globe className="w-3.5 h-3.5" />
                <span>+ Connect Website</span>
              </button>
            )}
            {project.githubRepoUrl ? (
              <a href={project.githubRepoUrl.startsWith("http") ? project.githubRepoUrl : `https://${project.githubRepoUrl}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:underline text-amber-500">
                <GitBranch className="w-3.5 h-3.5" />
                <span>{project.githubRepoUrl.replace("https://github.com/", "")}</span>
              </a>
            ) : (
              <button onClick={() => setShowAssetDrawer(true)} className="flex items-center gap-1 text-amber-500 hover:underline">
                <PlusCircle className="w-3 h-3" />
                <span>+ Connect GitHub</span>
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
          {project.id === "proj-prodexa-demo" && (
            <button
              onClick={async () => {
                await fetch("/api/projects/reset-demo", { method: "POST" });
                window.location.reload();
              }}
              className="btn btn-secondary btn-sm border-amber-500/30 text-amber-500"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Demo Workspace
            </button>
          )}
          <button
            onClick={() => setShowAssetDrawer(!showAssetDrawer)}
            className="btn btn-secondary btn-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} />
            Assets
          </button>
          <button
            onClick={handleExportPDF}
            className="btn btn-secondary btn-sm text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
            title="Export launch report as PDF / Print document"
          >
            <FileText className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} />
            <span>Export PDF</span>
          </button>
          <button
            onClick={handleExportMarkdown}
            className="btn btn-secondary btn-sm"
            title="Download markdown report file (.md)"
          >
            <FileCode2 className="w-3.5 h-3.5" style={{ color: "var(--success)" }} />
            <span>Export (.md)</span>
          </button>
          <button
            onClick={() => handleRevalidate()}
            disabled={revalidating}
            className="btn btn-primary btn-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${revalidating ? "anim-spin" : ""}`} />
            Run Audit
          </button>
        </div>
      </div>

      {/* Product Health Milestone Bar */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" style={{ color: "var(--success)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>Product Health</span>
          </div>
          <span className="text-sm font-bold font-mono" style={{ color: "var(--success)" }}>{healthScore}%</span>
        </div>
        <div className="w-full rounded-full h-2 overflow-hidden" style={{ background: "var(--bg)" }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${healthScore}%`,
              background: "linear-gradient(90deg, var(--accent), var(--success))",
            }}
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {milestoneBadges.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs transition-all ${
                m.failed
                  ? "bg-red-500/10 border-red-500/30 text-red-400"
                  : m.done
                  ? "badge-green"
                  : "badge-muted"
              }`}
            >
              {m.failed ? (
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-red-500" />
              ) : (
                <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 ${m.done ? "text-green-500" : "opacity-40"}`} />
              )}
              <span className="font-medium truncate">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Asset Connector Drawer */}
      {showAssetDrawer && (
        <form onSubmit={handleUpdateAssets} className="card p-5 space-y-4 anim-fade">
          <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" style={{ color: "var(--accent)" }} />
              <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Connect Project Assets</h3>
            </div>
            <button type="button" onClick={() => setShowAssetDrawer(false)} className="btn btn-ghost btn-sm">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Landing Page URL</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--text-faint)" }} />
                <input
                  type="url"
                  required
                  placeholder="https://your-landing-page.com"
                  value={inputWebsite}
                  onChange={(e) => setInputWebsite(e.target.value)}
                  className="input pl-10 font-mono"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>GitHub Repository URL</label>
              <div className="relative">
                <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--text-faint)" }} />
                <input
                  type="url"
                  placeholder="https://github.com/username/repo"
                  value={inputGithub}
                  onChange={(e) => setInputGithub(e.target.value)}
                  className="input pl-10 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updatingAssets}
              className="btn btn-primary"
            >
              {updatingAssets ? "Saving..." : "Save & Run Audit"}
            </button>
          </div>
        </form>
      )}

      {/* Main Tab Navigation */}
      <div className="tabs">
        {[
          { id: "overview" as const, label: "Readiness Report", icon: Activity },
          { id: "cofounder" as const, label: "AI Co-Founder", icon: Bot, badge: "AI" },
        ].map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`tab-btn ${activeTab === id ? "active" : ""}`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            {badge && (
              <span className="badge badge-amber text-[9px] font-mono">{badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* TAB: AI CO-FOUNDER */}
      {activeTab === "cofounder" && (
        <AICofounderTab
          projectId={project.id}
          projectName={project.name}
          healthScore={healthScore}
          readinessScore={currentRun?.overallScore ?? null}
        />
      )}

      {/* AUDIT PIPELINE EXECUTION VIEW */}
      {isAuditExecuting ? (
        <AuditPipelineViewer
          isExecuting={true}
          completedRun={currentRun}
          websiteUrl={project?.websiteUrl || inputWebsite}
          githubRepoUrl={project?.githubRepoUrl || inputGithub}
          onFinish={() => {
            setIsAuditExecuting(false);
            setRevalidating(false);
          }}
        />
      ) : activeTab === "overview" && (
        <div className="space-y-6">
          {/* Score Improvement Banner */}
          {scoreComparisonText && (
            <div className="badge badge-green p-3.5 rounded-xl text-xs font-mono flex items-center justify-between anim-fade w-full">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>{scoreComparisonText}</span>
              </div>
            </div>
          )}

          {/* Score Hero + Pipeline Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Score Card */}
            <div className="card p-6 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Launch Score</div>
              <ScoreRadial score={currentRun?.overallScore ?? null} size={140} strokeWidth={5} />
              <div className="text-xs max-w-[180px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
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
                <div className="card p-6 h-full space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Analysis Summary</h3>
                    {currentRun?.status === "completed" && (
                      <span className="badge badge-green font-mono uppercase">
                        Completed
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: "Issues Found", value: currentRun?.issues?.length || 0, color: "var(--text)" },
                      { label: "Critical Gaps", value: currentRun?.issues?.filter((i) => i.severity === "critical").length || 0, color: "var(--error)" },
                      { label: "Roadmap Tasks", value: currentRun?.roadmap?.length || 0, color: "var(--accent)" },
                    ].map((stat) => (
                      <div key={stat.label} className="card p-3.5 text-center" style={{ background: "var(--bg)" }}>
                        <div className="text-2xl font-bold font-mono" style={{ color: stat.color }}>{stat.value}</div>
                        <div className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    {currentRun
                      ? "All 6 modules executed deterministically. Review prioritized issues below and use Copy Fix to resolve gaps."
                      : "No audit run yet. Click Run Audit to analyze your product across 6 specialized readiness modules."}
                  </p>

                  {!currentRun && (
                    <button
                      onClick={() => handleRevalidate()}
                      disabled={revalidating}
                      className="btn btn-primary"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${revalidating ? "anim-spin" : ""}`} />
                      {revalidating ? "Starting..." : "Run First Audit"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 6 Module Score Cards — Linear / Vercel Redesign */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold tracking-tight" style={{ color: "var(--text)" }}>Module Scores</h3>
              <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>6 Modules Executed</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <CategoryCard
                title="Product Understanding"
                score={scores?.productUnderstanding ?? null}
                status={currentRun?.moduleStatus?.productUnderstanding?.status}
                reason={currentRun?.moduleStatus?.productUnderstanding?.reason}
                description="Value prop positioning, meta tags, and target audience definition."
                issues={currentRun?.issues?.filter((i) => i.category === "product")}
                source="AI + Rules Engine"
                confidence={94}
              />
              <CategoryCard
                title="Engineering Analysis"
                score={scores?.engineering ?? null}
                status={currentRun?.moduleStatus?.engineering?.status}
                reason={currentRun?.moduleStatus?.engineering?.reason}
                description="GitHub metadata, LICENSE, README completeness, and commit health."
                issues={currentRun?.issues?.filter((i) => i.category === "engineering")}
                source="GitHub API"
                confidence={98}
              />
              <CategoryCard
                title="UX Validation"
                score={scores?.ux ?? null}
                status={currentRun?.moduleStatus?.ux?.status}
                reason={currentRun?.moduleStatus?.ux?.reason}
                description="Mobile viewport, primary CTA visibility, and heading hierarchy."
                issues={currentRun?.issues?.filter((i) => i.category === "ux")}
                source="HTML Analysis"
                confidence={96}
              />
              <CategoryCard
                title="Web Performance Snapshot"
                score={scores?.performance ?? null}
                status={currentRun?.moduleStatus?.performance?.status}
                reason={currentRun?.moduleStatus?.performance?.reason}
                description="Empirical HTTP latency, estimated HTML size, and script payload."
                issues={currentRun?.issues?.filter((i) => i.category === "performance")}
                source="Performance Snapshot"
                confidence={99}
              />
              <CategoryCard
                title="Business Review"
                score={scores?.business ?? null}
                status={currentRun?.moduleStatus?.business?.status}
                reason={currentRun?.moduleStatus?.business?.reason}
                description="Pricing clarity, contact transparency, and market differentiation."
                issues={currentRun?.issues?.filter((i) => i.category === "business")}
                source="AI + Rules Engine"
                confidence={92}
              />
              <CategoryCard
                title="Launch Planner"
                score={currentRun?.overallScore ?? null}
                status="completed"
                description="Prioritized effort-reward roadmap across all modules."
                issues={currentRun?.issues}
                source="Rules Engine"
                confidence={98}
                topFinding="Highest ROI improvement: Fix primary CTA contrast and add open-source LICENSE file."
              />
            </div>
          </div>

          {/* Issues List */}
          {currentRun && (
            <div id="gaps-and-fixes-section" className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                  Prioritized Gaps &amp; Fixes
                  {currentRun.issues?.length > 0 && (
                    <span className="ml-2 badge badge-muted font-mono">
                      {currentRun.issues.length}
                    </span>
                  )}
                </h3>
              </div>

              {currentRun.issues?.length === 0 ? (
                <div className="card p-8 text-center space-y-2 border-green-500/20">
                  <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto" />
                  <div className="text-sm font-semibold text-green-500">Zero critical gaps detected!</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>Your product is launch-ready.</div>
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
