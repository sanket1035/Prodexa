"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Project } from "@/lib/types/schema";
import { PlusCircle, ExternalLink, ArrowRight, FolderGit2, Sparkles, Clock, TrendingUp } from "lucide-react";

export default function ProjectsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) { router.push("/login"); return; }
    if (user) {
      fetch(`/api/projects?userId=${user.uid}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.projects) setProjects(data.projects);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [user, authLoading, router]);

  const getScoreColor = (score: number | null) => {
    if (score === null) return { text: "#71717A", bg: "bg-white/[0.05]", border: "border-white/[0.08]" };
    if (score >= 80) return { text: "#22C55E", bg: "bg-[#22C55E]/10", border: "border-[#22C55E]/20" };
    if (score >= 60) return { text: "#F59E0B", bg: "bg-[#F59E0B]/10", border: "border-[#F59E0B]/20" };
    return { text: "#EF4444", bg: "bg-[#EF4444]/10", border: "border-[#EF4444]/20" };
  };

  if (authLoading || loading) {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-5">
          <div className="skeleton h-8 w-40" />
          <div className="skeleton h-9 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-44 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto w-full animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#FAFAFA] tracking-tight">Projects</h1>
          <p className="text-sm text-[#71717A] mt-0.5">
            {projects.length > 0 ? `${projects.length} product${projects.length !== 1 ? "s" : ""} tracked` : "Track your launch readiness"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/blueprint/new"
            className="inline-flex items-center gap-2 bg-[#18181B] hover:bg-[#1C1C1F] border border-white/[0.10] text-[#A1A1AA] hover:text-[#FAFAFA] text-xs font-medium px-3.5 py-2 rounded-lg transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
            New Idea Blueprint
          </Link>
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 bg-[#D97706] hover:bg-[#F59E0B] text-[#09090B] text-xs font-semibold px-3.5 py-2 rounded-lg transition-all hover:shadow-[0_0_12px_rgba(217,119,6,0.3)]"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Launch Audit
          </Link>
        </div>
      </div>

      {/* Empty State */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
          <div className="w-16 h-16 bg-[#18181B] border border-white/[0.08] rounded-2xl flex items-center justify-center">
            <FolderGit2 className="w-8 h-8 text-[#3F3F46]" />
          </div>
          <div className="space-y-2 max-w-sm">
            <h3 className="text-lg font-semibold text-[#FAFAFA]">No projects yet</h3>
            <p className="text-sm text-[#71717A] leading-relaxed">
              Start by generating an AI Blueprint from your idea, or run a launch audit on a product you've built.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/blueprint/new"
              className="inline-flex items-center gap-2 bg-[#18181B] hover:bg-[#1C1C1F] border border-[#D97706]/30 hover:border-[#D97706]/50 text-[#D97706] text-sm font-medium px-5 py-2.5 rounded-xl transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Generate AI Blueprint
            </Link>
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 bg-[#D97706] hover:bg-[#F59E0B] text-[#09090B] text-sm font-semibold px-5 py-2.5 rounded-xl transition-all hover:shadow-[0_0_16px_rgba(217,119,6,0.4)]"
            >
              <PlusCircle className="w-4 h-4" />
              Audit My Product
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project, idx) => {
            const score = getScoreColor(project.latestScore);
            return (
              <div
                key={project.id}
                className="group bg-[#111113] border border-white/[0.08] hover:border-white/[0.14] rounded-2xl p-5 space-y-4 transition-all hover:shadow-[0_0_24px_rgba(0,0,0,0.3)] animate-fade-in"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/dashboard/${project.id}`}
                      className="text-base font-semibold text-[#FAFAFA] hover:text-[#D97706] transition-colors block truncate"
                    >
                      {project.name}
                    </Link>
                    <div className="flex items-center gap-1.5 text-xs text-[#71717A] font-mono mt-1 truncate">
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{project.websiteUrl?.replace(/^https?:\/\//, "") ?? "No URL"}</span>
                    </div>
                  </div>

                  <div className={`flex-shrink-0 px-3 py-1.5 rounded-lg border ${score.bg} ${score.border} flex items-center gap-1`}>
                    <span className="font-mono font-bold text-base" style={{ color: score.text }}>
                      {project.latestScore !== null ? project.latestScore : "—"}
                    </span>
                    {project.latestScore !== null && (
                      <TrendingUp className="w-3.5 h-3.5" style={{ color: score.text }} />
                    )}
                  </div>
                </div>

                {project.githubRepoUrl && (
                  <a
                    href={project.githubRepoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-[#71717A] hover:text-[#A1A1AA] font-mono truncate flex items-center gap-1.5 transition-colors"
                  >
                    <span className="opacity-60">github.com/</span>
                    <span className="truncate">{project.githubRepoUrl.replace("https://github.com/", "")}</span>
                  </a>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-white/[0.07]">
                  <div className="flex items-center gap-1.5 text-xs text-[#71717A]">
                    <Clock className="w-3 h-3" />
                    {project.lastValidatedAt
                      ? new Date(project.lastValidatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : "Not yet audited"}
                  </div>
                  <Link
                    href={`/dashboard/${project.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D97706] hover:text-[#F59E0B] transition-colors group-hover:underline"
                  >
                    View Report
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
