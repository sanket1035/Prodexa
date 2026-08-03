"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";

interface CategoryCardProps {
  title: string;
  score: number | null;
  status?: "completed" | "skipped" | "failed";
  reason?: string;
  description: string;
}

export default function CategoryCard({
  title,
  score,
  status = "completed",
  reason,
  description,
}: CategoryCardProps) {
  const getScoreColor = (s: number | null) => {
    if (s === null || status !== "completed") return "text-[#8B8F97] bg-[#1E2124]";
    if (s >= 80) return "text-[#5FA88A] bg-[#5FA88A]/10 border-[#5FA88A]/20";
    if (s >= 60) return "text-[#C9A44C] bg-[#C9A44C]/10 border-[#C9A44C]/20";
    return "text-[#C25A4D] bg-[#C25A4D]/10 border-[#C25A4D]/20";
  };

  return (
    <div className="bg-[#16181B] border border-[#2A2D31] hover:border-[#3A3E45] rounded-[6px] p-5 space-y-3 transition-colors flex flex-col justify-between">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm text-[#EDEDEF] tracking-tight">{title}</h4>

          <div
            className={`px-2.5 py-1 rounded-[4px] border font-mono text-sm font-semibold ${getScoreColor(
              score
            )}`}
          >
            {status === "completed" && score !== null ? `${score}%` : "—"}
          </div>
        </div>

        <p className="text-xs text-[#8B8F97] leading-relaxed">{description}</p>
      </div>

      {status !== "completed" && (
        <div className="pt-2 border-t border-[#2A2D31] text-xs text-[#C9A44C] flex items-center gap-1.5 font-mono">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">Unable to analyze — {reason || "Module skipped"}</span>
        </div>
      )}
    </div>
  );
}
