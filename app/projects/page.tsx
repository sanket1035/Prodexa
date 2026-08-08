"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Project } from "@/lib/types/schema";
import {
  PlusCircle, ExternalLink, ArrowRight, FolderGit2, Sparkles,
  Clock, Zap, BarChart3, Trash2, Globe, GitBranch, Cpu, ShieldCheck,
  Pencil, X, Check
} from "lucide-react";

export default function ProjectsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      // 1. Scan and load instantly from localStorage project cache for THIS user
      const mergedLocal: Project[] = [];
      if (typeof window !== "undefined") {
        const userCached = localStorage.getItem(`prodexa_projects_${user.uid}`);
        if (userCached) {
          try {
            const parsed = JSON.parse(userCached);
            if (Array.isArray(parsed)) {
              parsed.forEach((p) => {
                if (p && p.id && !mergedLocal.some((lp) => lp.id === p.id)) mergedLocal.push(p);
              });
            }
          } catch {
            // ignore
          }
        }
      }

      if (mergedLocal.length > 0) {
        setProjects(mergedLocal);
      }

      // 2. Fetch fresh projects from API for THIS user
      fetch(`/api/projects?userId=${user.uid}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.projects) && data.projects.length > 0) {
            const apiProjects = data.projects.filter((p: Project) => p.userId === user.uid || !p.userId || user.uid === "demo-user-123");
            const combinedMap = new Map<string, Project>();
            apiProjects.forEach((p: Project) => combinedMap.set(p.id, p));
            mergedLocal.forEach((lp: Project) => {
              if (!combinedMap.has(lp.id)) {
                combinedMap.set(lp.id, lp);
              } else {
                const existing = combinedMap.get(lp.id)!;
                combinedMap.set(lp.id, {
                  ...existing,
                  name: (lp.name && lp.name !== "Workspace Project" && lp.name !== "Product Workspace") ? lp.name : existing.name,
                  websiteUrl: lp.websiteUrl || existing.websiteUrl || null,
                  githubRepoUrl: lp.githubRepoUrl || existing.githubRepoUrl || null,
                  latestScore: existing.latestScore ?? lp.latestScore,
                  lastValidatedAt: existing.lastValidatedAt || lp.lastValidatedAt,
                });
              }
            });
            const combined = Array.from(combinedMap.values());
            setProjects(combined);
            localStorage.setItem(`prodexa_projects_${user.uid}`, JSON.stringify(combined));
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [user, authLoading, router]);

  const handleDeleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("Are you sure you want to delete this project from your workspace?")) return;

    setDeletingId(projectId);
    try {
      await Promise.all([
        fetch(`/api/projects?id=${projectId}`, { method: "DELETE" }),
        fetch(`/api/projects/${projectId}`, { method: "DELETE" }),
      ]).catch(() => {});

      // Update state
      const updated = projects.filter((p) => p.id !== projectId);
      setProjects(updated);

      // Update localStorage for user
      if (user) {
        localStorage.setItem(`prodexa_projects_${user.uid}`, JSON.stringify(updated));
      }
      localStorage.removeItem(`prodexa_proj_${projectId}`);
      localStorage.removeItem(`prodexa_runs_${projectId}`);
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveProjectName = async (projectId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!editingName.trim()) return;

    setSavingName(true);
    const newName = editingName.trim();

    try {
      await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      }).catch(() => {});

      const updated = projects.map((p) => (p.id === projectId ? { ...p, name: newName } : p));
      setProjects(updated);

      if (user) {
        localStorage.setItem(`prodexa_projects_${user.uid}`, JSON.stringify(updated));
      }

      const existingSingle = localStorage.getItem(`prodexa_proj_${projectId}`);
      if (existingSingle) {
        try {
          const parsed = JSON.parse(existingSingle);
          localStorage.setItem(`prodexa_proj_${projectId}`, JSON.stringify({ ...parsed, name: newName }));
        } catch {}
      }

      setEditingProjectId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingName(false);
    }
  };
  const getDisplayProjectName = (p: Project): string => {
    const name = p.name;
    if (name && name !== "Workspace Project" && name !== "Product Workspace" && name !== "Untitled Project" && name.trim() !== "") {
      return name;
    }

    if (p.websiteUrl) {
      const clean = p.websiteUrl
        .replace(/^https?:\/\//, "")
        .replace(/\/.*$/, "")
        .replace(/\.vercel\.app$/, "")
        .replace(/\.app$/, "")
        .replace(/\.in$/, "")
        .replace(/\.com$/, "")
        .replace(/\.io$/, "")
        .replace(/\.ai$/, "");

      const parts = clean.split(/[-_.]/).filter((x) => x && !x.match(/^[a-z0-9]{6,10}$/));
      if (parts.length > 0) {
        return parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
      }
    }

    if (p.githubRepoUrl) {
      const repo = p.githubRepoUrl.replace("https://github.com/", "").split("/")[1] || "";
      if (repo) {
        const parts = repo.split(/[-_.]/).filter(Boolean);
        return parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
      }
    }

    return "Product Workspace";
  };

  const getScoreBadgeClass = (score: number | null) => {
    if (score === null) return "badge badge-muted";
    if (score >= 80) return "badge badge-green";
    if (score >= 60) return "badge badge-amber";
    return "badge badge-red";
  };

  if (authLoading || (loading && projects.length === 0)) {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between border-b pb-5" style={{ borderColor: "var(--border)" }}>
          <div className="skeleton h-8 w-48 rounded-lg" />
          <div className="flex gap-2">
            <div className="skeleton h-9 w-32 rounded-lg" />
            <div className="skeleton h-9 w-32 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-44 w-full rounded-2xl" />
            ))}
          </div>
          <div className="skeleton h-96 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  const getEffectiveProjectScore = (p: Project) => {
    if (p.latestScore !== null && p.latestScore !== undefined) {
      return { score: p.latestScore, date: p.lastValidatedAt };
    }
    if (typeof window !== "undefined") {
      const cachedRunsStr = localStorage.getItem(`prodexa_runs_${p.id}`);
      if (cachedRunsStr) {
        try {
          const cachedRuns = JSON.parse(cachedRunsStr);
          if (Array.isArray(cachedRuns) && cachedRuns.length > 0) {
            const latest = cachedRuns[0];
            if (latest && latest.overallScore !== undefined && latest.overallScore !== null) {
              return { score: latest.overallScore as number, date: latest.completedAt || latest.createdAt };
            }
          }
        } catch {}
      }
    }
    return { score: null, date: p.lastValidatedAt };
  };

  const validScores = projects
    .map((p) => getEffectiveProjectScore(p).score)
    .filter((s): s is number => s !== null);
  const avgScore = validScores.length > 0 ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : null;
  const maxScore = validScores.length > 0 ? Math.max(...validScores) : null;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full anim-fade">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5" style={{ borderColor: "var(--border)" }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text)" }}>Product Workspace</h1>
            <span className="badge badge-amber text-[10px] font-mono">
              Enterprise OS
            </span>
          </div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {projects.length > 0
              ? `${projects.length} product${projects.length !== 1 ? "s" : ""} tracked across 6-module readiness pipeline`
              : "Manage your product blueprints and launch readiness audits"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/blueprint/new"
            className="btn btn-secondary btn-sm"
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} />
            New Idea Blueprint
          </Link>
          <Link
            href="/projects/new"
            className="btn btn-primary btn-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Launch Audit
          </Link>
        </div>
      </div>

      {/* Main Grid */}
      {projects.length === 0 ? (
        <div className="card p-10 text-center space-y-6 max-w-xl mx-auto my-8" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto" style={{ background: "rgba(217,119,6,0.12)", border: "1px solid rgba(217,119,6,0.2)" }}>
            <FolderGit2 className="w-7 h-7" style={{ color: "var(--accent)" }} />
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-semibold" style={{ color: "var(--text)" }}>No Products Tracked Yet</h3>
            <p className="text-xs leading-relaxed max-w-md mx-auto" style={{ color: "var(--text-muted)" }}>
              Initialize your first product workspace to analyze code, UX, performance, and business readiness.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2">
            <Link
              href="/blueprint/new"
              className="p-4 rounded-xl border transition-all hover:border-amber-500/50 group"
              style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", textDecoration: "none" }}
            >
              <div className="flex items-center justify-between mb-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
              </div>
              <div className="text-xs font-semibold text-zinc-200">Option A — New Idea</div>
              <div className="text-[11px] text-zinc-500 mt-1">Generate complete product blueprint from an idea</div>
            </Link>

            <Link
              href="/projects/new"
              className="p-4 rounded-xl border transition-all hover:border-amber-500/50 group"
              style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", textDecoration: "none" }}
            >
              <div className="flex items-center justify-between mb-2">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
              </div>
              <div className="text-xs font-semibold text-zinc-200">Option B — Audit Site</div>
              <div className="text-[11px] text-zinc-500 mt-1">Run 6-module launch audit on existing URL</div>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column: Project Cards */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider font-mono" style={{ color: "var(--text-faint)" }}>
                Active Products ({projects.length})
              </h2>
            </div>

            <div className="space-y-3">
              {projects.map((project, idx) => {
                const { score: effectiveScore, date: effectiveDate } = getEffectiveProjectScore(project);
                const hasWebsite = Boolean(project.websiteUrl && !project.websiteUrl.includes("example-landing-page.com"));
                const hasGithub = Boolean(project.githubRepoUrl && project.githubRepoUrl.trim() !== "");

                return (
                  <div
                    key={project.id}
                    className="card p-5 space-y-4 transition-all hover:border-zinc-700/80 anim-fade-up"
                    style={{ animationDelay: `${idx * 40}ms` }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-1.5">
                        {editingProjectId === project.id ? (
                          <form onSubmit={(e) => handleSaveProjectName(project.id, e)} className="flex items-center gap-2">
                            <input
                              type="text"
                              autoFocus
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              placeholder="Enter product name..."
                              className="input py-1 px-2.5 text-xs font-semibold w-full max-w-xs"
                            />
                            <button
                              type="submit"
                              disabled={savingName}
                              className="btn btn-primary btn-sm px-2 py-1"
                              title="Save Product Name"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingProjectId(null)}
                              className="btn btn-secondary btn-sm px-2 py-1"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </form>
                        ) : (
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={`/dashboard/${project.id}`}
                              className="text-base font-semibold transition-colors hover:text-[color:var(--accent)] truncate"
                              style={{ color: "var(--text)", textDecoration: "none" }}
                            >
                              {getDisplayProjectName(project)}
                            </Link>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setEditingProjectId(project.id);
                                setEditingName(getDisplayProjectName(project));
                              }}
                              className="p-1 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-amber-400 transition-colors"
                              title="Rename Product"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <span className="badge badge-zinc text-[10px] font-mono">
                              AI Memory v1
                            </span>
                          </div>
                        )}

                        {/* Connected Assets Badges */}
                        <div className="flex items-center gap-3 text-xs font-mono pt-1">
                          <div className={`flex items-center gap-1.5 ${hasWebsite ? "text-green-400" : "text-zinc-500"}`}>
                            <Globe className="w-3.5 h-3.5" />
                            <span>{hasWebsite ? project.websiteUrl?.replace(/^https?:\/\//, "").split("/")[0] : "Website Unconnected"}</span>
                          </div>

                          <div className={`flex items-center gap-1.5 ${hasGithub ? "text-amber-400" : "text-zinc-500"}`}>
                            <GitBranch className="w-3.5 h-3.5" />
                            <span>{hasGithub ? project.githubRepoUrl?.replace("https://github.com/", "") : "Repo Unconnected"}</span>
                          </div>
                        </div>

                        {/* 2-Folder Logical Layout */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3">
                          {/* Folder A: Blueprint */}
                          <div className="p-3 rounded-xl border space-y-1" style={{ background: "rgba(24, 24, 27, 0.4)", borderColor: "var(--border)" }}>
                            <div className="flex items-center justify-between text-zinc-400 font-mono text-[10px] font-semibold">
                              <div className="flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                <span>📁 BLUEPRINT</span>
                              </div>
                              {project.blueprintId && project.blueprintId.trim() !== "" ? (
                                <span className="text-amber-400 font-mono text-[9px] bg-amber-500/10 px-1.5 py-0.5 rounded">CONNECTED</span>
                              ) : (
                                <span className="text-zinc-500 font-mono text-[9px]">NOT CREATED</span>
                              )}
                            </div>
                            {project.blueprintId && project.blueprintId.trim() !== "" ? (
                              <Link
                                href={`/blueprint/${project.blueprintId}`}
                                className="text-xs text-amber-300 hover:underline flex items-center gap-1 font-medium truncate pt-0.5"
                              >
                                <span>View Blueprint →</span>
                              </Link>
                            ) : (
                              <Link
                                href="/blueprint/new"
                                className="text-xs text-zinc-400 hover:text-amber-400 flex items-center gap-1 pt-0.5"
                              >
                                <span>+ Create Blueprint</span>
                              </Link>
                            )}
                          </div>

                          {/* Folder B: Audits */}
                          <div className="p-3 rounded-xl border space-y-1" style={{ background: "rgba(24, 24, 27, 0.4)", borderColor: "var(--border)" }}>
                            <div className="flex items-center justify-between text-zinc-400 font-mono text-[10px] font-semibold">
                              <div className="flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                                <span>📁 AUDITS</span>
                              </div>
                              <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded ${getScoreBadgeClass(effectiveScore)}`}>
                                {effectiveScore !== null ? `${effectiveScore}%` : "Unaudited"}
                              </span>
                            </div>
                            <Link
                              href={`/dashboard/${project.id}/history`}
                              className="text-xs text-zinc-300 hover:text-amber-400 flex items-center gap-1 font-medium pt-0.5"
                            >
                              <span>View Audit Runs →</span>
                            </Link>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`font-mono font-bold text-sm px-2.5 py-1 ${getScoreBadgeClass(effectiveScore)}`}>
                          {effectiveScore !== null ? `${effectiveScore}%` : "Unaudited"}
                        </span>
                      </div>
                    </div>

                    {/* Footer Row */}
                    <div className="flex items-center justify-between pt-3 border-t text-xs" style={{ borderColor: "var(--border)" }}>
                      <div className="flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                        <Clock className="w-3.5 h-3.5" />
                        {effectiveDate
                          ? `Audited ${new Date(effectiveDate).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`
                          : "Ready for launch audit"}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleDeleteProject(project.id, e)}
                          disabled={deletingId === project.id}
                          className="p-1.5 rounded-lg text-xs transition-colors hover:bg-red-500/20 hover:text-red-400"
                          style={{ color: "var(--text-faint)", border: "1px solid var(--border)" }}
                          title="Delete project from workspace"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <Link
                          href={`/dashboard/${project.id}`}
                          className="btn btn-secondary btn-sm"
                        >
                          <span>Open Workspace</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Quick Stats Panel */}
          <div className="space-y-4">
            <div className="card p-5 space-y-4">
              <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: "var(--border)" }}>
                <BarChart3 className="w-4 h-4" style={{ color: "var(--accent)" }} />
                <h3 className="text-xs font-semibold uppercase tracking-wider font-mono" style={{ color: "var(--text)" }}>
                  Workspace Overview
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="card p-3 text-center" style={{ background: "var(--bg)" }}>
                  <div className="text-2xl font-bold font-mono" style={{ color: "var(--accent)" }}>
                    {projects.length}
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>Total Projects</div>
                </div>

                <div className="card p-3 text-center" style={{ background: "var(--bg)" }}>
                  <div className="text-2xl font-bold font-mono" style={{ color: avgScore !== null && avgScore >= 80 ? "var(--success)" : "var(--warning)" }}>
                    {avgScore !== null ? `${avgScore}%` : "—"}
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>Avg Readiness</div>
                </div>
              </div>

              {maxScore !== null && (
                <div className="p-3 rounded-lg flex items-center justify-between text-xs font-mono" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                  <span style={{ color: "var(--text-muted)" }}>Highest Score</span>
                  <span className="font-bold" style={{ color: "var(--success)" }}>{maxScore}%</span>
                </div>
              )}
            </div>

            <div className="card p-5 space-y-3">
              <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: "var(--border)" }}>
                <Zap className="w-4 h-4" style={{ color: "var(--accent)" }} />
                <h3 className="text-xs font-semibold uppercase tracking-wider font-mono" style={{ color: "var(--text)" }}>
                  Quick Launch Actions
                </h3>
              </div>

              <Link
                href="/blueprint/new"
                className="btn btn-secondary w-full justify-between text-xs font-medium"
              >
                <span>Generate Idea Blueprint</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <Link
                href="/projects/new"
                className="btn btn-secondary w-full justify-between text-xs font-medium"
              >
                <span>Audit Product Website</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
