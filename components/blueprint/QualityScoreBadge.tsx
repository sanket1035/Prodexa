"use client";

import React, { useState } from "react";
import { BlueprintQualityScore } from "@/lib/types/blueprint";
import { Award, ChevronDown, ChevronUp, HelpCircle } from "lucide-react";

interface QualityScoreBadgeProps {
  score: BlueprintQualityScore;
}

export default function QualityScoreBadge({ score }: QualityScoreBadgeProps) {
  const [showWhy, setShowWhy] = useState(false);

  const getScoreBadgeClass = (s: number) => {
    if (s >= 85) return "badge badge-green";
    if (s >= 70) return "badge badge-amber";
    return "badge badge-red";
  };

  const getBarColor = (s: number) => {
    if (s >= 85) return "var(--success)";
    if (s >= 70) return "var(--warning)";
    return "var(--error)";
  };

  const metrics = [
    { label: "Technical Feasibility", value: score.metrics.technicalFeasibility },
    { label: "Business Potential", value: score.metrics.businessPotential },
    { label: "Innovation", value: score.metrics.innovation },
    { label: "Scalability", value: score.metrics.scalability },
    { label: "Market Readiness", value: score.metrics.marketReadiness },
    { label: "AI Necessity", value: score.metrics.aiNecessity },
  ];

  return (
    <div className="card p-5 space-y-4 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(217,119,6,0.12)", border: "1px solid rgba(217,119,6,0.2)", color: "var(--accent)" }}>
            <Award className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Blueprint Quality Score</h3>
              <span className="badge badge-muted text-[10px] font-mono uppercase">
                Viability Rating
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              Structured evaluation across 6 technical &amp; market dimensions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center">
          <div className={`px-3 py-1 rounded-lg font-mono font-bold text-xl flex items-center gap-1 ${getScoreBadgeClass(score.overall)}`}>
            <span>{score.overall}</span>
            <span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}>/100</span>
          </div>

          <button
            onClick={() => setShowWhy(!showWhy)}
            className="btn btn-secondary btn-sm"
          >
            <HelpCircle className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} />
            <span>Why {score.overall}?</span>
            {showWhy ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 6 Sub-Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-1">
        {metrics.map((m) => (
          <div key={m.label} className="card p-2.5 space-y-1.5" style={{ background: "var(--bg)" }}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[11px]" style={{ color: "var(--text)" }}>{m.label}</span>
              <span className="font-mono text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>{m.value}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "var(--surface)" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${m.value}%`, background: getBarColor(m.value) }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Score Rationale Dropdown Drawer */}
      {showWhy && (
        <div className="card p-4 space-y-3 anim-fade text-xs" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
          <div className="font-mono uppercase font-semibold text-[11px]" style={{ color: "var(--accent)" }}>
            Evaluation Summary Rationale:
          </div>
          <p className="leading-relaxed font-mono" style={{ color: "var(--text-secondary)" }}>
            {score.rationale}
          </p>
        </div>
      )}
    </div>
  );
}
