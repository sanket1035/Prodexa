"use client";

import React, { useState } from "react";
import { BlueprintQualityScore } from "@/lib/types/blueprint";
import { Award, ChevronDown, ChevronUp, HelpCircle, CheckCircle2, AlertTriangle } from "lucide-react";

interface QualityScoreBadgeProps {
  score: BlueprintQualityScore;
}

export default function QualityScoreBadge({ score }: QualityScoreBadgeProps) {
  const [showWhy, setShowWhy] = useState(false);

  const getScoreColor = (s: number) => {
    if (s >= 85) return "text-[#5FA88A] bg-[#5FA88A]/10 border-[#5FA88A]/30";
    if (s >= 70) return "text-[#C9A44C] bg-[#C9A44C]/10 border-[#C9A44C]/30";
    return "text-[#C25A4D] bg-[#C25A4D]/10 border-[#C25A4D]/30";
  };

  const getBarColor = (s: number) => {
    if (s >= 85) return "bg-[#5FA88A]";
    if (s >= 70) return "bg-[#C9A44C]";
    return "bg-[#C25A4D]";
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
    <div className="bg-[#16181B] border border-[#2A2D31] rounded-[6px] p-5 space-y-4 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2A2D31] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#D97B3F]/10 border border-[#D97B3F]/30 rounded-[6px] flex items-center justify-center text-[#D97B3F]">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-[#EDEDEF]">Blueprint Quality Score</h3>
              <span className="text-[10px] font-mono uppercase bg-[#1E2124] text-[#8B8F97] px-2 py-0.5 rounded border border-[#2A2D31]">
                Viability Rating
              </span>
            </div>
            <p className="text-xs text-[#8B8F97] mt-0.5">
              Structured evaluation across 6 technical & market dimensions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center">
          <div className={`px-3 py-1 rounded-[6px] border font-mono font-bold text-xl flex items-center gap-1 ${getScoreColor(score.overall)}`}>
            <span>{score.overall}</span>
            <span className="text-xs font-normal text-[#8B8F97]">/100</span>
          </div>

          <button
            onClick={() => setShowWhy(!showWhy)}
            className="flex items-center gap-1.5 bg-[#1E2124] hover:bg-[#25292E] text-[#D97B3F] border border-[#2A2D31] px-3 py-1.5 rounded-[6px] text-xs font-mono transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Why {score.overall}?</span>
            {showWhy ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 6 Sub-Metrics Grid with HSL Styled Progress Bars */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-1">
        {metrics.map((m) => (
          <div key={m.label} className="bg-[#0B0C0E] border border-[#2A2D31] p-2.5 rounded-[6px] space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#EDEDEF] font-medium text-[11px]">{m.label}</span>
              <span className="font-mono text-[#8B8F97] text-[11px] font-semibold">{m.value}%</span>
            </div>
            <div className="h-1.5 w-full bg-[#1E2124] rounded-full overflow-hidden">
              <div className={`h-full ${getBarColor(m.value)} transition-all duration-300`} style={{ width: `${m.value}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Expandable "Why?" Rationale Drawer */}
      {showWhy && (
        <div className="bg-[#0B0C0E] border border-[#2A2D31] rounded-[6px] p-4 space-y-4 mt-2 font-mono">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#D97B3F] mb-1 font-semibold">
              Score Rationale
            </div>
            <p className="text-xs text-[#EDEDEF] leading-relaxed font-sans">{score.rationale}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#2A2D31]">
            <div className="space-y-1.5">
              <div className="text-[10px] font-mono uppercase text-[#5FA88A] flex items-center gap-1.5 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Key Strengths
              </div>
              <ul className="space-y-1 text-xs text-[#8B8F97] font-sans">
                {score.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-[#5FA88A]">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-1.5">
              <div className="text-[10px] font-mono uppercase text-[#C9A44C] flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" />
                Key Risks & Weaknesses
              </div>
              <ul className="space-y-1 text-xs text-[#8B8F97] font-sans">
                {score.weaknesses.map((w, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-[#C9A44C]">•</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
