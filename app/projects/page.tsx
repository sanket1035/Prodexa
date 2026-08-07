"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Project } from "@/lib/types/schema";
import {
  PlusCircle, ExternalLink, ArrowRight, FolderGit2, Sparkles,
  Clock, Zap, BarChart3, Trash2
} from "lucide-react";

export default function ProjectsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
                if (existing.latestScore === null && lp.latestScore !== null) {
                  combinedMap.set(lp.id, { ...existing, latestScore: lp.latestScore, lastValidatedAt: lp.lastValidatedAt });
                }
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
      await fetch(`/api/projects?id=${projectId}`, { method: "DELETE" });

      // Update state
      const updated = projects.filter((p) => p.id !== projectId);
      setProjects(updated);

      // Update localStorage
      if (user) {
        localStorage.setItem(`prodexa_projects_${user.uid}`, JSON.stringify(updated));
      }
      localStorage.removeItem(`prodexa_proj_${projectId}`);
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
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
          <div className="skeleton h-8 w-40" />
          <div className="skeleton h-9 w-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-36 w-full" />
            ))}
          </div>
          <div className="skeleton h-96 w-full" />
        </div>
      </div>
    );
  }

  const validScores = projects.map((p) => p.latestScore).filter((s): s is number => s !== null);
  const avgScore = validScores.length > 0 ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : null;
  const maxScore = validScores.length > 0 ? Math.max(...validScores) : null;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full anim-fade">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5" style={{ borderColor: "var(--border)" }}>
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text)" }}>Product Workspace</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            {projects.length > 0
              ? `${projects.length} product${projects.length !== 1 ? "s" : ""} tracked across launch readiness pipeline`
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
        <div className="card p-12 text-center space-y-5 max-w-lg mx-auto my-12">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto" style={{ background: "rgba(217,119,6,0.12)", border: "1px solid rgba(217,119,6,0.2)" }}>
            <FolderGit2 className="w-7 h-7" style={{ color: "var(--accent)" }} />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-semibold" style={{ color: "var(--text)" }}>No products tracked yet</h3>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Start by creating an AI Blueprint for a new idea (Option A) or running a Launch Audit on an existing product (Option B).
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/blueprint/new" className="btn btn-secondary">
              <Sparkles className="w-4 h-4" style={{ color: "var(--accent)" }} />
              Option A — New Idea
            </Link>
            <Link href="/projects/new" className="btn btn-primary">
              <PlusCircle className="w-4 h-4" />
              Option B — Launch Audit
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column: Project Cards */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider font-mono" style={{ color: "var(--text-faint)" }}>
                Active Projects ({projects.length})
              </h2>
            </div>

            <div className="space-y-3">
              {projects.map((project, idx) => (
                <div
                  key={project.id}
                  className="card p-5 space-y-4 anim-fade-up"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/${project.id}`}
                          className="text-base font-semibold transition-colors hover:text-[color:var(--accent)] truncate"
                          style={{ color: "var(--text)", textDecoration: "none" }}
                        >
                          {project.name}
                        </Link>
                        {project.blueprintId && (
                          <span className="badge badge-amber text-[10px] font-mono">
                            Blueprint
                          </span>
                        )}
                      </div>

                      {project.websiteUrl && (
                        <a
                          href={project.websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-xs font-mono transition-colors"
                          style={{ color: "var(--text-muted)" }}
                        >
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{project.websiteUrl.replace(/^https?:\/\//, "")}</span>
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`font-mono font-bold text-sm px-2.5 py-1 ${getScoreBadgeClass(project.latestScore)}`}>
                        {project.latestScore !== null ? `${project.latestScore}%` : "Unaudited"}
                      </span>
                    </div>
                  </div>

                  {project.githubRepoUrl && (
                    <div className="text-xs font-mono truncate" style={{ color: "var(--text-faint)" }}>
                      GitHub: <span style={{ color: "var(--text-muted)" }}>{project.githubRepoUrl.replace("https://github.com/", "")}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t text-xs" style={{ borderColor: "var(--border)" }}>
                    <div className="flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                      <Clock className="w-3 h-3" />
                      {project.lastValidatedAt
                        ? `Audited ${new Date(project.lastValidatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                        : "Ready for launch audit"}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleDeleteProject(project.id, e)}
                        disabled={deletingId === project.id}
                        className="p-1.5 rounded text-xs transition-colors hover:bg-red-500/20 hover:text-red-400"
                        style={{ color: "var(--text-faint)", border: "1px solid var(--border)" }}
                        title="Delete project from workspace"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <Link
                        href={`/dashboard/${project.id}`}
                        className="btn btn-secondary btn-sm"
                      >
                        <span>View Report</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
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
