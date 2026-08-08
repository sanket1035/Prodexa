"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Project, ValidationRun } from "@/lib/types/schema";
import { getDerivedProjectName } from "@/lib/utils/project-name";
import { ArrowLeft, TrendingUp, History, CheckCircle2, ShieldCheck, Sparkles, Clock, Calendar } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function HistoryPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [runs, setRuns] = useState<ValidationRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;

    let cachedProj: Project | null = null;
    let cachedRuns: ValidationRun[] = [];

    if (typeof window !== "undefined") {
      const projStr = localStorage.getItem(`prodexa_proj_${projectId}`);
      if (projStr) {
        try { cachedProj = JSON.parse(projStr); } catch {}
      }
      const runsStr = localStorage.getItem(`prodexa_runs_${projectId}`);
      if (runsStr) {
        try { cachedRuns = JSON.parse(runsStr); } catch {}
      }
    }

    if (cachedProj) setProject(cachedProj);
    if (cachedRuns.length > 0) setRuns(cachedRuns);

    Promise.all([
      fetch(`/api/projects/${projectId}`).then((res) => res.json()).catch(() => ({ success: false })),
      fetch(`/api/projects/${projectId}/history`).then((res) => res.json()).catch(() => ({ success: false })),
    ])
      .then(([pRes, rRes]) => {
        if (pRes.success && pRes.project) {
          setProject(pRes.project);
          if (typeof window !== "undefined") localStorage.setItem(`prodexa_proj_${projectId}`, JSON.stringify(pRes.project));
        }
        if (rRes.success && Array.isArray(rRes.runs) && rRes.runs.length > 0) {
          setRuns(rRes.runs);
          if (typeof window !== "undefined") localStorage.setItem(`prodexa_runs_${projectId}`, JSON.stringify(rRes.runs));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto w-full">
        <div className="skeleton h-8 w-48 rounded-lg" />
        <div className="skeleton h-64 w-full rounded-2xl" />
        <div className="skeleton h-80 w-full rounded-2xl" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-12 text-center text-xs font-mono" style={{ color: "var(--text-muted)" }}>
        Project workspace not found.
      </div>
    );
  }

  // Format data for Recharts line chart (chronological order)
  const chartData = [...runs]
    .reverse()
    .filter((r) => r.overallScore !== null)
    .map((r, i) => {
      const d = new Date(r.createdAt);
      const dateLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const timeLabel = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
      return {
        // Use "Aug 8 · 11:49" so runs on same day get unique X positions
        date: `${dateLabel} · ${timeLabel}`,
        label: `Run #${i + 1}`,
        score: r.overallScore,
      };
    });

  const firstScore = chartData[0]?.score || 0;
  const latestScore = chartData[chartData.length - 1]?.score || 0;
  const scoreDiff = latestScore - firstScore;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto w-full anim-fade">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5" style={{ borderColor: "var(--border)" }}>
        <div className="space-y-1.5">
          <Link
            href={`/dashboard/${projectId}`}
            className="inline-flex items-center gap-1.5 text-xs font-mono transition-colors hover:underline"
            style={{ color: "var(--accent)" }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Launch Dashboard
          </Link>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text)" }}>
            {getDerivedProjectName(project)} — Execution Timeline
          </h1>
        </div>

        {chartData.length > 1 && (
          <div className="px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-2" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span style={{ color: "var(--text-muted)" }}>Readiness Growth:</span>
            <span className={scoreDiff >= 0 ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
              {scoreDiff >= 0 ? `+${scoreDiff}%` : `${scoreDiff}%`}
            </span>
          </div>
        )}
      </div>

      {/* Readiness Score Over Time Chart */}
      <div className="card p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold uppercase font-mono tracking-wider flex items-center gap-2" style={{ color: "var(--text)" }}>
              <History className="w-4 h-4 text-amber-500" />
              Readiness Score Trend
            </h3>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Historical readiness scores across all validation runs.
            </p>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="py-12 text-center text-xs font-mono" style={{ color: "var(--text-muted)" }}>
            No completed validation runs recorded yet.
          </div>
        ) : (
          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ bottom: 30 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="var(--text-muted)"
                  tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "monospace" }}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="var(--text-muted)"
                  tick={{ fill: "var(--text-muted)", fontSize: 12, fontFamily: "monospace" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--surface)",
                    borderColor: "var(--border)",
                    borderRadius: "12px",
                    color: "var(--text)",
                    fontFamily: "monospace",
                  }}
                  formatter={(value: any, _name: any, props: any) => [
                    `${value}%`,
                    props?.payload?.label || "Score",
                  ]}
                  labelFormatter={(label) => label}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="var(--accent)"
                  strokeWidth={2.5}
                  dot={{ fill: "var(--accent)", r: 5 }}
                  activeDot={{ r: 7, fill: "var(--accent)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Vercel / Linear Style Sequential Timeline */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase font-mono tracking-wider" style={{ color: "var(--text-faint)" }}>
            Deployment & Audit Milestones ({runs.length})
          </h3>
        </div>

        {runs.length === 0 ? (
          <div className="card p-8 text-center space-y-3">
            <ShieldCheck className="w-8 h-8 mx-auto text-zinc-600" />
            <p className="text-xs text-zinc-400 font-mono">No audit runs recorded in timeline.</p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-zinc-800">
            {runs.map((r, index) => {
              const runDate = new Date(r.createdAt);
              const scores = (r.moduleScores || {}) as unknown as Record<string, number | null>;

              return (
                <div key={r.id} className="relative flex items-start gap-4 group">
                  {/* Timeline Dot */}
                  <div className="absolute -left-6 top-1.5 w-5 h-5 rounded-full bg-zinc-900 border-2 border-amber-500 flex items-center justify-center text-amber-500 shadow-md">
                    <CheckCircle2 className="w-3 h-3" />
                  </div>

                  {/* Milestone Card */}
                  <div className="card p-5 flex-1 space-y-3 transition-all hover:border-zinc-700/80">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3" style={{ borderColor: "var(--border)" }}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-zinc-200">
                          Launch Audit Run #{runs.length - index}
                        </span>
                        <span className="badge badge-amber font-mono text-[10px]">
                          {r.id}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{runDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                          <span className="text-zinc-600">at</span>
                          <span>{runDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>

                        <span className={`font-mono font-bold text-xs px-2.5 py-1 rounded-full ${
                          r.overallScore && r.overallScore >= 80
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        }`}>
                          Score: {r.overallScore !== null ? `${r.overallScore}%` : "Unaudited"}
                        </span>
                      </div>
                    </div>

                    {/* Module Score Breakdown Chips */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-[11px] font-mono pt-1">
                      {[
                        { label: "Product", val: scores.productUnderstanding },
                        { label: "Engineering", val: scores.engineering },
                        { label: "UX", val: scores.ux },
                        { label: "Performance", val: scores.performance },
                        { label: "Business", val: scores.business },
                        { label: "Planner", val: scores.planner },
                      ].map((m) => (
                        <div key={m.label} className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800 text-center">
                          <div className="text-zinc-500 text-[10px] uppercase">{m.label}</div>
                          <div className={`font-bold mt-0.5 ${m.val !== null && m.val !== undefined ? "text-zinc-200" : "text-zinc-600"}`}>
                            {m.val !== null && m.val !== undefined ? `${m.val}%` : "Skipped"}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer Action */}
                    <div className="flex justify-end pt-2">
                      <Link
                        href={`/dashboard/${projectId}?runId=${r.id}`}
                        className="text-xs font-mono text-amber-500 hover:underline flex items-center gap-1"
                      >
                        View Full Run Report →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
