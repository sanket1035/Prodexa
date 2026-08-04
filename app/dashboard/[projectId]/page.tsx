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
import { generateMarkdownReport, downloadFile } from "@/lib/pdf/exporter";

import {
  RefreshCw,
  Download,
  FileCode2,
  History,
  TrendingUp,
  Globe,
  GitBranch,
  Activity,
  Lightbulb,
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

  // Poll active run status if status is running
  useEffect(() => {
    if (!projectId) return;

    let intervalId: NodeJS.Timeout | null = null;

    const loadData = async () => {
      try {
        const [pRes, rRes] = await Promise.all([
          fetch(`/api/projects/${projectId}`).then((r) => r.json()),
          fetch(`/api/projects/${projectId}/history`).then((r) => r.json()),
        ]);

        if (pRes.success) setProject(pRes.project);

        const runs: ValidationRun[] = rRes.success ? rRes.runs : [];

        if (runs.length > 0) {
          const activeRun = runIdParam
            ? runs.find((r) => r.id === runIdParam) || runs[0]
            : runs[0];

          setCurrentRun(activeRun);
          if (runs.length > 1) {
            setPreviousRun(runs[1]);
          }

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
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [projectId, runIdParam]);

  const handleRevalidate = async () => {
    if (!project) return;
    setRevalidating(true);

    try {
      const res = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          userId: project.userId,
        }),
      });

      const data = await res.json();
      if (data.success && data.runId) {
        router.push(`/dashboard/${project.id}?runId=${data.runId}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRevalidating(false);
    }
  };

  const handleExportMarkdown = () => {
    if (!project || !currentRun) return;
    const md = generateMarkdownReport(project, currentRun);
    downloadFile(`${project.name.toLowerCase().replace(/\s+/g, "-")}-readiness-report.md`, md, "text/markdown");
  };

  const handleExportPdf = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-8 max-w-6xl mx-auto w-full">
        <div className="h-10 w-64 bg-[#16181B] rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-[#16181B] border border-[#2A2D31] rounded-[6px] animate-pulse" />
          <div className="h-64 md:col-span-2 bg-[#16181B] border border-[#2A2D31] rounded-[6px] animate-pulse" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-12 text-center text-[#8B8F97] font-mono">
        Project not found or removed.
      </div>
    );
  }

  const isRunning = currentRun?.status === "running";
  const scores = currentRun?.moduleScores;

  const currentOverall = currentRun?.overallScore;
  const previousOverall = previousRun?.overallScore;
  let scoreComparisonText: string | null = null;
  if (
    currentOverall !== undefined &&
    currentOverall !== null &&
    previousRun &&
    previousOverall !== undefined &&
    previousOverall !== null
  ) {
    const diff = currentOverall - previousOverall;
    const daysAgo = Math.max(1, Math.round((Date.now() - new Date(previousRun.createdAt).getTime()) / (1000 * 3600 * 24)));
    scoreComparisonText = `You were ${previousOverall}% ready ${daysAgo} day${daysAgo > 1 ? "s" : ""} ago. Now you're ${currentOverall}%. (${diff >= 0 ? `+${diff}%` : `${diff}%`})`;
  }

  // Calculate Product Health Score
  const healthScore = project.healthScore || (currentRun?.status === "completed" ? 100 : 50);

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto w-full">
      {/* Top Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#2A2D31] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-medium text-[#EDEDEF] tracking-tight">{project.name}</h1>
            <span className="text-xs font-mono uppercase bg-[#1E2124] text-[#D97B3F] px-2.5 py-0.5 rounded border border-[#2A2D31]">
              Launch Report
            </span>
            {project.blueprintId && (
              <Link
                href={`/blueprint/${project.blueprintId}`}
                className="text-[10px] font-mono uppercase bg-[#5FA88A]/10 text-[#5FA88A] px-2 py-0.5 rounded border border-[#5FA88A]/20 flex items-center gap-1 hover:underline"
              >
                <Lightbulb className="w-3 h-3" />
                Linked AI Blueprint
              </Link>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-[#8B8F97] mt-1.5 flex-wrap">
            <a
              href={project.websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-[#EDEDEF] transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-[#D97B3F]" />
              {project.websiteUrl}
            </a>
            {project.githubRepoUrl && (
              <a
                href={project.githubRepoUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 hover:text-[#EDEDEF] transition-colors"
              >
                <GitBranch className="w-3.5 h-3.5 text-[#6E7B8B]" />
                {project.githubRepoUrl.replace("https://github.com/", "")}
              </a>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/dashboard/${project.id}/history`}
            className="flex items-center gap-1.5 bg-[#16181B] hover:bg-[#1E2124] text-[#EDEDEF] border border-[#2A2D31] px-3 py-2 rounded-[6px] text-xs font-mono transition-colors"
          >
            <History className="w-3.5 h-3.5 text-[#8B8F97]" />
            History
          </Link>

          <button
            onClick={handleExportMarkdown}
            className="flex items-center gap-1.5 bg-[#16181B] hover:bg-[#1E2124] text-[#EDEDEF] border border-[#2A2D31] px-3 py-2 rounded-[6px] text-xs font-mono transition-colors"
          >
            <FileCode2 className="w-3.5 h-3.5 text-[#5FA88A]" />
            Export Markdown
          </button>

          <button
            onClick={handleExportPdf}
            className="flex items-center gap-1.5 bg-[#16181B] hover:bg-[#1E2124] text-[#EDEDEF] border border-[#2A2D31] px-3 py-2 rounded-[6px] text-xs font-mono transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#6E7B8B]" />
            Export PDF
          </button>

          <button
            onClick={handleRevalidate}
            disabled={revalidating || isRunning}
            className="flex items-center gap-1.5 bg-[#D97B3F] hover:bg-[#E88A4E] text-[#0B0C0E] px-4 py-2 rounded-[6px] text-xs font-mono font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${revalidating || isRunning ? "animate-spin" : ""}`} />
            Re-validate
          </button>
        </div>
      </div>

      {/* Product Health Progress Tracker */}
      <div className="bg-[#16181B] border border-[#2A2D31] rounded-[6px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-[#5FA88A]" />
          <div>
            <div className="text-xs font-mono uppercase text-[#EDEDEF] font-medium">Product Health Progress</div>
            <div className="text-xs text-[#8B8F97]">Continuous lifecycle tracking from Day 0 Blueprint to Launch Audit</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-48 bg-[#0B0C0E] border border-[#2A2D31] rounded-full h-2 overflow-hidden">
            <div className="bg-[#5FA88A] h-full transition-all duration-500" style={{ width: `${healthScore}%` }} />
          </div>
          <span className="font-mono text-sm font-bold text-[#5FA88A]">{healthScore}%</span>
        </div>
      </div>

      {/* Re-validation Comparison Banner if score history exists */}
      {scoreComparisonText && (
        <div className="bg-[#5FA88A]/10 border border-[#5FA88A]/30 text-[#5FA88A] rounded-[6px] p-3.5 text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span>{scoreComparisonText}</span>
          </div>
          <Link href={`/dashboard/${project.id}/history`} className="underline font-semibold">
            View Trend
          </Link>
        </div>
      )}

      {/* Main Hero Grid: Radial Score + Progress Tracker or Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Overall Score Radial Card */}
        <div className="bg-[#16181B] border border-[#2A2D31] rounded-[6px] p-6 flex flex-col items-center justify-center space-y-4 text-center">
          <div className="text-xs font-mono uppercase tracking-wider text-[#8B8F97]">
            Overall Readiness Score
          </div>

          <ScoreRadial score={currentRun?.overallScore ?? null} size={150} strokeWidth={6} />

          <div className="text-xs text-[#8B8F97] max-w-xs leading-relaxed">
            {currentRun?.overallScore !== null
              ? "Calculated deterministically across completed analysis modules."
              : "Analysis running — score will compute upon completion."}
          </div>
        </div>

        {/* Live Progress Tracker or Module Summary */}
        <div className="md:col-span-2">
          {isRunning ? (
            <ProgressTracker
              currentModule={currentRun?.currentModule ?? null}
              status={currentRun?.status ?? "pending"}
            />
          ) : (
            <div className="bg-[#16181B] border border-[#2A2D31] rounded-[6px] p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#2A2D31] pb-3">
                <h3 className="text-sm font-medium text-[#EDEDEF] uppercase font-mono tracking-wider">
                  Analysis Pipeline Summary
                </h3>
                <span className="text-xs font-mono text-[#5FA88A] bg-[#5FA88A]/10 px-2 py-0.5 rounded border border-[#5FA88A]/20">
                  Run Completed
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono">
                <div>
                  <div className="text-[#8B8F97]">Issues Identified</div>
                  <div className="text-lg font-bold text-[#EDEDEF] mt-0.5">
                    {currentRun?.issues?.length || 0}
                  </div>
                </div>
                <div>
                  <div className="text-[#8B8F97]">Critical Gaps</div>
                  <div className="text-lg font-bold text-[#C25A4D] mt-0.5">
                    {currentRun?.issues?.filter((i) => i.severity === "critical").length || 0}
                  </div>
                </div>
                <div>
                  <div className="text-[#8B8F97]">Roadmap Tasks</div>
                  <div className="text-lg font-bold text-[#D97B3F] mt-0.5">
                    {currentRun?.roadmap?.length || 0}
                  </div>
                </div>
              </div>

              <p className="text-xs text-[#8B8F97] leading-relaxed pt-2">
                All 6 specialized readiness modules executed deterministically. Review prioritized action items below and click <span className="text-[#D97B3F] font-mono">Copy Fix</span> to resolve gaps before launch day.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 6 Category Score Cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-[#EDEDEF] uppercase font-mono tracking-wider">
          Module Category Scores
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
            description="Pricing model clarity, contact transparency, and market differentiation."
          />
          <CategoryCard
            title="Launch Planner"
            score={currentRun?.overallScore ?? null}
            status="completed"
            description="Prioritized effort-reward roadmap aggregation across all modules."
          />
        </div>
      </div>

      {/* Prioritized Issue List with Copy Fix */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-[#EDEDEF] uppercase font-mono tracking-wider">
            Prioritized Gaps & Deterministic Fixes ({currentRun?.issues?.length || 0})
          </h3>
        </div>

        {currentRun?.issues?.length === 0 ? (
          <div className="bg-[#16181B] border border-[#2A2D31] rounded-[6px] p-8 text-center text-xs text-[#8B8F97] font-mono">
            Zero critical gaps detected! Your product is launch-ready.
          </div>
        ) : (
          <div className="space-y-3">
            {currentRun?.issues?.map((issue) => (
              <IssueRow key={issue.id} issue={issue} />
            ))}
          </div>
        )}
      </div>

      {/* Launch Roadmap Section */}
      {currentRun?.roadmap && currentRun.roadmap.length > 0 && (
        <RoadmapSection items={currentRun.roadmap} />
      )}
    </div>
  );
}
