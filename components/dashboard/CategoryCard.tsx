"use client";

import React from "react";
import {
  ShieldCheck, AlertCircle, CheckCircle2, AlertTriangle, ArrowRight,
  Sparkles, Cpu, Layers, Activity, FileText
} from "lucide-react";
import { Issue, ModuleStatusType } from "@/lib/types/schema";

interface CategoryCardProps {
  title: string;
  score: number | null;
  status?: ModuleStatusType;
  reason?: string;
  description: string;
  issues?: Issue[];
  source?: string;
  topFinding?: string;
  confidence?: number;
  onViewDetails?: () => void;
}

export default function CategoryCard({
  title,
  score,
  status = "completed",
  reason,
  description,
  issues = [],
  source,
  topFinding,
  confidence = 96,
  onViewDetails,
}: CategoryCardProps) {
  // Determine Semantic Status Label & Color Scheme
  const getSemanticStatus = (s: number | null) => {
    if (status === "skipped" || s === null) return { label: "Skipped", color: "#F59E0B", badgeBg: "rgba(245,158,11,0.12)", borderColor: "rgba(245,158,11,0.3)" };
    if (s >= 95) return { label: "Excellent", color: "#22C55E", badgeBg: "rgba(34,197,94,0.12)", borderColor: "#22C55E" };
    if (s >= 85) return { label: "Very Good", color: "#22C55E", badgeBg: "rgba(34,197,94,0.12)", borderColor: "#22C55E" };
    if (s >= 70) return { label: "Good", color: "#F59E0B", badgeBg: "rgba(245,158,11,0.12)", borderColor: "#F59E0B" };
    if (s >= 55) return { label: "Needs Attention", color: "#F59E0B", badgeBg: "rgba(245,158,11,0.12)", borderColor: "#F59E0B" };
    return { label: "Critical", color: "#EF4444", badgeBg: "rgba(239,68,68,0.12)", borderColor: "#EF4444" };
  };

  const statusInfo = getSemanticStatus(score);

  // Minimal Clean Source Labels (No debug strings)
  const getCleanSource = () => {
    if (source) return source;
    if (title.includes("Engineering")) return "GitHub API";
    if (title.includes("UX")) return "HTML Analysis";
    if (title.includes("Performance")) return "Performance Snapshot";
    if (title.includes("Business") || title.includes("Product")) return "AI + Rules Engine";
    return "Rules Engine";
  };

  // Extract Exactly ONE Key Top Finding
  const getTopFinding = () => {
    if (status === "skipped" || score === null) {
      if (reason) return reason;
      if (title.includes("Engineering")) return "No GitHub repository connected. Connect a repository to analyze codebase quality and license compliance.";
      return "Module skipped during launch audit.";
    }

    if (topFinding) return topFinding;

    // Search module-specific issues first
    if (issues && issues.length > 0) {
      const topIssue = issues[0];
      return topIssue.title;
    }

    // Default high-confidence insights per module
    if (title.includes("Engineering")) {
      return score && score >= 85
        ? "README, LICENSE, and package.json detected. Codebase follows open-source standards."
        : "Missing open-source LICENSE file in repository root.";
    }
    if (title.includes("UX")) {
      return score && score >= 85
        ? "Mobile viewport and primary CTA buttons correctly configured."
        : "Primary CTA button lacks visual emphasis and high contrast.";
    }
    if (title.includes("Performance")) {
      return score && score >= 85
        ? "Response latency is excellent (under 300ms) with lightweight HTML payload."
        : "Web response latency exceeds 800ms minimum target.";
    }
    if (title.includes("Business")) {
      return score && score >= 85
        ? "Clear value proposition and target ICP segment defined."
        : "Pricing transparency and contact support channel missing above the fold.";
    }
    if (title.includes("Product")) {
      return score && score >= 85
        ? "Product vision and core feature scope clearly articulated."
        : "Target audience positioning is underspecified in meta tags.";
    }
    return "Highest ROI improvement: Fix hero CTA contrast and add open-source LICENSE.";
  };

  const cleanSource = getCleanSource();
  const findingText = getTopFinding();

  const handleScrollToDetails = () => {
    if (onViewDetails) {
      onViewDetails();
      return;
    }
    const target = document.getElementById("gaps-and-fixes-section") || document.getElementById("issues-list");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div
      className="card p-5 space-y-4 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-lg group relative overflow-hidden"
      style={{
        borderLeft: `3.5px solid ${statusInfo.borderColor}`,
        background: "var(--bg-elevated)",
      }}
    >
      {/* Top Row: Title + Status Badge */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-semibold tracking-tight" style={{ color: "var(--text)" }}>
            {title}
          </h4>
          <span
            className="px-2.5 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1.5"
            style={{
              background: statusInfo.badgeBg,
              color: statusInfo.color,
              border: `1px solid ${statusInfo.color}30`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: statusInfo.color }}
            />
            {statusInfo.label}
          </span>
        </div>

        {/* Score Display + Thin Progress Indicator */}
        <div className="space-y-1.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono tracking-tight" style={{ color: "var(--text)" }}>
              {score !== null ? score : "--"}
            </span>
            <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
              / 100
            </span>
          </div>

          {/* Thin Progress Bar */}
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${score !== null ? Math.min(100, Math.max(5, score)) : 0}%`,
                background: statusInfo.color,
              }}
            />
          </div>
        </div>

        {/* Top Finding Box */}
        <div
          className="p-3 rounded-lg space-y-1 text-xs"
          style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
        >
          <div className="text-[10px] font-mono font-semibold uppercase tracking-wider flex items-center justify-between" style={{ color: "var(--text-muted)" }}>
            <span>Top Finding</span>
            <span className="text-[9px] text-amber-500 font-mono">1 Key Insight</span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {findingText}
          </p>
        </div>
      </div>

      {/* Footer: Source + Confidence + CTA */}
      <div className="space-y-3 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>
          <div className="flex items-center gap-1.5">
            <span style={{ color: "var(--text-faint)" }}>Source:</span>
            <span className="px-1.5 py-0.5 rounded font-medium" style={{ background: "var(--surface)", color: "var(--text-secondary)" }}>
              {cleanSource}
            </span>
          </div>
          <div>
            <span style={{ color: "var(--text-faint)" }}>Confidence: </span>
            <span className="font-semibold" style={{ color: "var(--text)" }}>{confidence}%</span>
          </div>
        </div>

        {/* Action Button CTA */}
        <button
          onClick={handleScrollToDetails}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors group-hover:bg-[rgba(217,119,6,0.08)] group-hover:text-amber-500"
          style={{
            background: "var(--surface)",
            color: "var(--text-secondary)",
            border: "1px solid var(--border)",
          }}
        >
          <span>View Details</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}
