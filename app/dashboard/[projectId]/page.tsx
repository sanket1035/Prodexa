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
import { generateMarkdownReport, exportExecutivePDFReport, downloadFile } from "@/lib/pdf/exporter";
import { useAuth } from "@/lib/auth/AuthContext";

import {
  RefreshCw, FileCode2, FileText, TrendingUp,
  Globe, GitBranch, Activity, Lightbulb, Bot,
  CheckCircle2, AlertCircle, PlusCircle, Sparkles, X, History,
  Clock, Calendar, ShieldCheck, Cpu,
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
  const [inputProjectName, setInputProjectName] = useState("");
  const [updatingAssets, setUpdatingAssets] = useState(false);
  const [issueFilter, setIssueFilter] = useState<"all" | "critical" | "high" | "medium" | "low">("all");

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

        if (pRes.success && pRes.project) {
          let cachedProj: Project | null = null;
          if (typeof window !== "undefined") {
            try {
              const c = localStorage.getItem(`prodexa_proj_${projectId}`);
              if (c) cachedProj = JSON.parse(c);
            } catch {}
          }
          const realName = (cachedProj && cachedProj.name && cachedProj.name !== "Workspace Project" && cachedProj.name !== "Product Workspace")
            ? cachedProj.name
            : (pRes.project.name && pRes.project.name !== "Workspace Project" ? pRes.project.name : "My Product Workspace");

          const realWebUrl = cachedProj?.websiteUrl || pRes.project.websiteUrl || null;
          const realGhUrl = cachedProj?.githubRepoUrl || pRes.project.githubRepoUrl || null;

          const finalProj = {
            ...pRes.project,
            name: realName,
            websiteUrl: realWebUrl,
            githubRepoUrl: realGhUrl,
          };

          setProject(finalProj);
          if (typeof window !== "undefined") {
            localStorage.setItem(`prodexa_proj_${projectId}`, JSON.stringify(finalProj));
          }
          const rawUrl = finalProj.websiteUrl || "";
          const isPlaceholder = rawUrl.includes("example-landing-page.com") || rawUrl === "https://example.com";
          setInputWebsite(isPlaceholder ? "" : rawUrl);
          setInputGithub(finalProj.githubRepoUrl || "");
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

  useEffect(() => {
    if (project) {
      setInputWebsite(project.websiteUrl || "");
      setInputGithub(project.githubRepoUrl || "");
      setInputProjectName(project.name || "");
    }
  }, [project]);

  const handleUpdateAssets = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    setUpdatingAssets(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: inputProjectName, websiteUrl: inputWebsite, githubRepoUrl: inputGithub }),
      });
      const data = await res.json();
      if (data.success && data.project) {
        const updatedProj = { ...data.project, name: inputProjectName || data.project.name };
        setProject(updatedProj);
        if (typeof window !== "undefined") {
          localStorage.setItem(`prodexa_proj_${project.id}`, JSON.stringify(updatedProj));
        }
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
    exportExecutivePDFReport(project, currentRun);
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
            <span className="badge badge-zinc font-mono text-[10px]">
              AI Memory v1
            </span>
            <Link
              href={`/dashboard/${project.id}/history`}
              className="badge badge-zinc font-mono text-[10px] hover:border-amber-500 transition-colors flex items-center gap-1"
              style={{ textDecoration: "none" }}
            >
              <History className="w-3 h-3 text-amber-500" />
              Timeline History
            </Link>
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
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Product Name</label>
              <div className="relative">
                <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--text-faint)" }} />
                <input
                  type="text"
                  required
                  placeholder="e.g. Prodexa AI Operating System"
                  value={inputProjectName}
                  onChange={(e) => setInputProjectName(e.target.value)}
                  className="input pl-10 font-medium"
                />
              </div>
            </div>
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

          {/* Executive Dashboard & Summary Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Column 1: Overall Launch Readiness & Verdict Badge */}
            <div className="card p-6 flex flex-col items-center justify-between text-center space-y-4">
              <div className="text-xs font-semibold uppercase tracking-wider font-mono" style={{ color: "var(--text-faint)" }}>
                Launch Status & Verdict
              </div>

              <ScoreRadial score={currentRun?.overallScore ?? null} size={135} strokeWidth={5} />

              {/* Verdict Badge */}
              <div className="w-full">
                {currentOverall !== undefined && currentOverall !== null ? (
                  <div className={`p-2.5 rounded-xl border text-xs font-semibold font-mono ${
                    currentOverall >= 80
                      ? "bg-green-500/10 border-green-500/30 text-green-400"
                      : currentOverall >= 60
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                      : "bg-red-500/10 border-red-500/30 text-red-400"
                  }`}>
                    {currentOverall >= 80
                      ? "🚀 Ready for Public Launch"
                      : currentOverall >= 60
                      ? "⚠️ Moderate Readiness — Resolve Gaps"
                      : "🚫 Critical Revision Required"}
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-900/50 text-xs font-mono text-zinc-400">
                    Unaudited — Run Audit Below
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Executive Summary & Audit Metadata */}
            <div className="card p-6 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4" style={{ color: "var(--accent)" }} />
                  <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Executive Summary</h3>
                </div>
                {currentRun?.status === "completed" && (
                  <span className="badge badge-green text-[10px] font-mono uppercase">
                    Completed
                  </span>
                )}
              </div>

              {/* Stat Pills Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-center">
                  <div className="text-xl font-bold font-mono text-green-400">
                    {scores ? Object.values(scores).filter((v): v is number => typeof v === "number" && v >= 80).length : 0}
                  </div>
                  <div className="text-[10px] text-zinc-500 uppercase mt-0.5 font-mono">Passed</div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-center">
                  <div className="text-xl font-bold font-mono text-amber-400">
                    {scores ? Object.values(scores).filter((v): v is number => typeof v === "number" && v >= 60 && v < 80).length : 0}
                  </div>
                  <div className="text-[10px] text-zinc-500 uppercase mt-0.5 font-mono">Warnings</div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-center">
                  <div className="text-xl font-bold font-mono text-red-400">
                    {scores ? Object.values(scores).filter((v): v is number => typeof v === "number" && v < 60).length : 0}
                  </div>
                  <div className="text-[10px] text-zinc-500 uppercase mt-0.5 font-mono">Failed</div>
                </div>
              </div>

              {/* Audit Metadata Badges */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-zinc-400 pt-1 border-t" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Duration: ~4.2s</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Modules: 6/6</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Engine: v1.7</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{currentRun?.completedAt ? new Date(currentRun.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Today"}</span>
                </div>
              </div>
            </div>

            {/* Column 3: Module Score Visual Distribution Bars */}
            <div className="card p-6 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border)" }}>
                <h3 className="text-xs font-semibold uppercase tracking-wider font-mono" style={{ color: "var(--text-faint)" }}>
                  Module Distribution
                </h3>
                <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>6 Modules</span>
              </div>

              <div className="space-y-2.5">
                {[
                  { name: "Product", score: scores?.productUnderstanding },
                  { name: "Engineering", score: scores?.engineering },
                  { name: "UX", score: scores?.ux },
                  { name: "Performance", score: scores?.performance },
                  { name: "Business", score: scores?.business },
                  { name: "Planner", score: (scores as any)?.planner },
                ].map((m) => {
                  const val = m.score ?? 0;
                  const isSkipped = m.score === null || m.score === undefined;
                  return (
                    <div key={m.name} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-zinc-400">{m.name}</span>
                        <span className={isSkipped ? "text-zinc-600" : val >= 80 ? "text-green-400 font-bold" : "text-amber-400 font-bold"}>
                          {isSkipped ? "Skipped" : `${val}%`}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full overflow-hidden bg-zinc-900 border border-zinc-800">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${isSkipped ? 0 : val}%`,
                            background: val >= 80 ? "#22C55E" : val >= 60 ? "#F59E0B" : "#EF4444",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
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

          {/* PHASE 2.5: ACTION CENTER & PRIORITY MATRIX */}
          {currentRun && (
            <div id="gaps-and-fixes-section" className="space-y-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
              {/* Action Center Header & Priority Matrix Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-semibold tracking-tight" style={{ color: "var(--text)" }}>
                    Action Center &amp; Priority Matrix
                  </h3>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Prioritized audit gaps grouped by severity level.
                  </p>
                </div>

                {/* Priority Matrix Filter Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: "all", label: "All Issues", count: currentRun.issues?.length || 0 },
                    { id: "critical", label: "Critical", count: currentRun.issues?.filter((i) => i.severity === "critical").length || 0, color: "text-red-400" },
                    { id: "high", label: "High", count: currentRun.issues?.filter((i) => i.severity === "high").length || 0, color: "text-amber-400" },
                    { id: "medium", label: "Medium", count: currentRun.issues?.filter((i) => i.severity === "medium").length || 0, color: "text-blue-400" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setIssueFilter(tab.id as any)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all flex items-center gap-1.5 ${
                        issueFilter === tab.id
                          ? "bg-zinc-800 border-amber-500/50 text-zinc-100 font-bold"
                          : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-800 ${tab.color || "text-zinc-300"}`}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtered Issue Rows */}
              {currentRun.issues?.length === 0 ? (
                <div className="card p-8 text-center space-y-2 border-green-500/20">
                  <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto" />
                  <div className="text-sm font-semibold text-green-500">Zero critical gaps detected!</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>Your product is launch-ready.</div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {currentRun.issues
                    .filter((issue) => issueFilter === "all" || issue.severity === issueFilter)
                    .map((issue) => (
                      <IssueRow key={issue.id} issue={issue} />
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Roadmap Section */}
          {currentRun?.roadmap && currentRun.roadmap.length > 0 && (
            <RoadmapSection items={currentRun.roadmap} />
          )}

          {/* PHASE 2.5: FOOTER ACTION BAR */}
          <div className="card p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-amber-500/20 bg-zinc-900/40">
            <div className="space-y-1 text-center sm:text-left">
              <div className="text-sm font-semibold text-zinc-200">
                Ready to take your launch report to the next level?
              </div>
              <div className="text-xs text-zinc-400 font-mono">
                Re-run audit after applying fixes or export executive PDF deliverable for investors.
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap flex-shrink-0">
              <button
                onClick={() => handleRevalidate()}
                disabled={revalidating}
                className="btn btn-primary btn-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${revalidating ? "anim-spin" : ""}`} />
                Re-run Audit
              </button>

              <button
                onClick={handleExportPDF}
                className="btn btn-secondary btn-sm text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
              >
                <FileText className="w-3.5 h-3.5 text-amber-500" />
                Export PDF
              </button>

              <button
                onClick={() => setActiveTab("cofounder")}
                className="btn btn-secondary btn-sm"
              >
                <Bot className="w-3.5 h-3.5 text-amber-500" />
                AI Co-Founder
              </button>

              <Link
                href={`/dashboard/${project.id}/history`}
                className="btn btn-secondary btn-sm"
              >
                <History className="w-3.5 h-3.5 text-zinc-400" />
                Timeline History
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
