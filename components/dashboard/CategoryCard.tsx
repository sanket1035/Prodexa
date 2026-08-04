"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, MinusCircle } from "lucide-react";
import { ModuleStatusType } from "@/lib/types/schema";

interface CategoryCardProps {
  title: string;
  score: number | null;
  status?: ModuleStatusType;
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
  const getBadgeStyle = (s: number | null) => {
    if (s === null) return "bg-[#1E2124] text-[#8B8F97] border-[#2A2D31]";
    if (s >= 85) return "bg-[#5FA88A]/10 text-[#5FA88A] border-[#5FA88A]/30";
    if (s >= 70) return "bg-[#C9A44C]/10 text-[#C9A44C] border-[#C9A44C]/30";
    return "bg-[#C25A4D]/10 text-[#C25A4D] border-[#C25A4D]/30";
  };

  return (
    <div className="bg-[#16181B] border border-[#2A2D31] hover:border-[#3A3E45] rounded-[6px] p-4 space-y-3 transition-colors flex flex-col justify-between">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-medium text-[#EDEDEF]">{title}</h4>
          {status === "completed" && score !== null ? (
            <span
              className={`px-2 py-0.5 rounded font-mono font-bold text-xs border ${getBadgeStyle(
                score
              )}`}
            >
              {score}%
            </span>
          ) : status === "skipped" ? (
            <span className="px-2 py-0.5 rounded font-mono text-[10px] uppercase bg-[#C9A44C]/10 text-[#C9A44C] border border-[#C9A44C]/20 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Skipped
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded font-mono text-[10px] uppercase bg-[#1E2124] text-[#8B8F97] border border-[#2A2D31] flex items-center gap-1">
              <MinusCircle className="w-3 h-3" />
              Pending
            </span>
          )}
        </div>

        <p className="text-xs text-[#8B8F97] leading-relaxed">{description}</p>
      </div>

      {reason && (
        <div className="pt-2 border-t border-[#2A2D31] text-[11px] font-mono text-[#C9A44C] flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{reason}</span>
        </div>
      )}
    </div>
  );
}
