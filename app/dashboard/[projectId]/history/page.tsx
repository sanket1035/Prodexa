"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Project, ValidationRun } from "@/lib/types/schema";
import { ArrowLeft, TrendingUp, History } from "lucide-react";
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

    Promise.all([
      fetch(`/api/projects/${projectId}`).then((res) => res.json()),
      fetch(`/api/projects/${projectId}/history`).then((res) => res.json()),
    ])
      .then(([pRes, rRes]) => {
        if (pRes.success) setProject(pRes.project);
        if (rRes.success) setRuns(rRes.runs);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return (
      <div className="p-8 space-y-6 max-w-5xl mx-auto w-full">
        <div className="h-8 w-48 bg-[#16181B] rounded animate-pulse" />
        <div className="h-64 bg-[#16181B] border border-[#2A2D31] rounded-[6px] animate-pulse" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center text-[#8B8F97]">Project not found.</div>
    );
  }

  // Format data for Recharts line chart (chronological order)
  const chartData = [...runs]
    .reverse()
    .filter((r) => r.overallScore !== null)
    .map((r) => ({
      date: new Date(r.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      score: r.overallScore,
    }));

  const firstScore = chartData[0]?.score || 0;
  const latestScore = chartData[chartData.length - 1]?.score || 0;
  const scoreDiff = latestScore - firstScore;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between border-b border-[#2A2D31] pb-4">
        <div className="space-y-1">
          <Link
            href={`/dashboard/${projectId}`}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-[#D97B3F] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Project Dashboard
          </Link>
          <h1 className="text-2xl font-medium text-[#EDEDEF]">
            {project.name} — Readiness Score History
          </h1>
        </div>

        {chartData.length > 1 && (
          <div className="px-3 py-1.5 bg-[#16181B] border border-[#2A2D31] rounded-[6px] text-xs font-mono flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#5FA88A]" />
            <span className="text-[#8B8F97]">Trend:</span>
            <span className={scoreDiff >= 0 ? "text-[#5FA88A]" : "text-[#C25A4D]"}>
              {scoreDiff >= 0 ? `+${scoreDiff}%` : `${scoreDiff}%`}
            </span>
          </div>
        )}
      </div>

      {/* Chart Card */}
      <div className="bg-[#16181B] border border-[#2A2D31] rounded-[6px] p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-[#EDEDEF] uppercase font-mono tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-[#D97B3F]" />
              Score Over Time
            </h3>
            <p className="text-xs text-[#8B8F97]">
              Historical readiness scores across all validation runs.
            </p>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#8B8F97] font-mono">
            No completed validation runs recorded yet.
          </div>
        ) : (
          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid stroke="#2A2D31" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#8B8F97"
                  tick={{ fill: "#8B8F97", fontSize: 12, fontFamily: "monospace" }}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="#8B8F97"
                  tick={{ fill: "#8B8F97", fontSize: 12, fontFamily: "monospace" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0B0C0E",
                    borderColor: "#2A2D31",
                    borderRadius: "6px",
                    color: "#EDEDEF",
                    fontFamily: "monospace",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#D97B3F"
                  strokeWidth={2.5}
                  dot={{ fill: "#D97B3F", r: 4 }}
                  activeDot={{ r: 6, fill: "#E88A4E" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* History Table */}
      <div className="bg-[#16181B] border border-[#2A2D31] rounded-[6px] overflow-hidden space-y-0">
        <div className="p-4 bg-[#1E2124] border-b border-[#2A2D31] text-xs font-mono uppercase tracking-wider text-[#8B8F97] grid grid-cols-4">
          <span>Run ID</span>
          <span>Date</span>
          <span>Status</span>
          <span className="text-right">Score</span>
        </div>

        <div className="divide-y divide-[#2A2D31]">
          {runs.map((r) => (
            <div key={r.id} className="p-4 grid grid-cols-4 items-center text-sm">
              <span className="font-mono text-xs text-[#EDEDEF]">{r.id}</span>
              <span className="text-xs text-[#8B8F97]">
                {new Date(r.createdAt).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <span className="text-xs font-mono text-[#D97B3F] uppercase">{r.status}</span>
              <span className="text-right font-mono font-bold text-[#EDEDEF]">
                {r.overallScore !== null ? `${r.overallScore}%` : "—"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
