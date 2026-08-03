"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Project } from "@/lib/types/schema";
import { PlusCircle, ExternalLink, ArrowRight, FolderGit2 } from "lucide-react";

export default function ProjectsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      fetch(`/api/projects?userId=${user.uid}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.projects) {
            setProjects(data.projects);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [user, authLoading, router]);

  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-[#8B8F97] bg-[#1E2124] border-[#2A2D31]";
    if (score >= 80) return "text-[#5FA88A] bg-[#5FA88A]/10 border-[#5FA88A]/20";
    if (score >= 60) return "text-[#C9A44C] bg-[#C9A44C]/10 border-[#C9A44C]/20";
    return "text-[#C25A4D] bg-[#C25A4D]/10 border-[#C25A4D]/20";
  };

  if (authLoading || loading) {
    return (
      <div className="p-8 space-y-6 max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between border-b border-[#2A2D31] pb-4">
          <div className="h-8 w-48 bg-[#16181B] rounded animate-pulse" />
          <div className="h-10 w-36 bg-[#16181B] rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 bg-[#16181B] border border-[#2A2D31] rounded-[6px] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2A2D31] pb-6">
        <div>
          <h1 className="text-2xl font-medium text-[#EDEDEF] tracking-tight">
            Validation Projects
          </h1>
          <p className="text-sm text-[#8B8F97] mt-1">
            Track pre-launch readiness metrics across your submitted products.
          </p>
        </div>

        <Link
          href="/projects/new"
          className="inline-flex items-center gap-2 bg-[#D97B3F] hover:bg-[#E88A4E] text-[#0B0C0E] font-medium px-4 py-2.5 rounded-[6px] text-sm transition-colors focus-visible:outline-2 focus-visible:outline-[#D97B3F]"
        >
          <PlusCircle className="w-4 h-4" />
          New Validation
        </Link>
      </div>

      {/* Empty State */}
      {projects.length === 0 ? (
        <div className="bg-[#16181B] border border-[#2A2D31] rounded-[6px] p-10 text-center space-y-4 max-w-lg mx-auto my-12">
          <div className="w-12 h-12 bg-[#1E2124] border border-[#2A2D31] rounded-full flex items-center justify-center mx-auto text-[#8B8F97]">
            <FolderGit2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-medium text-[#EDEDEF]">No projects validated yet</h3>
            <p className="text-xs text-[#8B8F97]">
              Submit your website URL & GitHub repository to get a 6-module Launch Readiness Report.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 bg-[#D97B3F] hover:bg-[#E88A4E] text-[#0B0C0E] font-medium px-4 py-2.5 rounded-[6px] text-sm transition-colors"
            >
              Validate your first product
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-[#16181B] border border-[#2A2D31] hover:border-[#3A3E45] rounded-[6px] p-5 space-y-4 transition-colors flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/dashboard/${project.id}`}
                      className="font-medium text-lg text-[#EDEDEF] hover:text-[#D97B3F] transition-colors"
                    >
                      {project.name}
                    </Link>
                    <div className="text-xs text-[#8B8F97] font-mono truncate max-w-xs mt-0.5">
                      {project.websiteUrl}
                    </div>
                  </div>

                  <div className={`px-3 py-1.5 rounded-[4px] border font-mono font-semibold text-lg flex items-center gap-1 ${getScoreColor(project.latestScore)}`}>
                    <span>{project.latestScore !== null ? `${project.latestScore}%` : "—"}</span>
                  </div>
                </div>

                {project.githubRepoUrl && (
                  <div className="text-xs text-[#8B8F97] flex items-center gap-1.5 font-mono">
                    <ExternalLink className="w-3.5 h-3.5 text-[#6E7B8B]" />
                    <a
                      href={project.githubRepoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline text-[#8B8F97] truncate"
                    >
                      {project.githubRepoUrl.replace("https://github.com/", "")}
                    </a>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-[#2A2D31] flex items-center justify-between text-xs text-[#8B8F97]">
                <div>
                  Last validated:{" "}
                  <span className="font-mono text-[#EDEDEF]">
                    {project.lastValidatedAt
                      ? new Date(project.lastValidatedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Never"}
                  </span>
                </div>

                <Link
                  href={`/dashboard/${project.id}`}
                  className="inline-flex items-center gap-1 text-[#D97B3F] hover:text-[#E88A4E] font-medium"
                >
                  View Report
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
