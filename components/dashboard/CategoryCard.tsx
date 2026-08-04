"use client";

import React from "react";
import { AlertTriangle, MinusCircle } from "lucide-react";
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
  const getBadgeClass = (s: number | null) => {
    if (s === null) return "badge badge-muted";
    if (s >= 85) return "badge badge-green";
    if (s >= 70) return "badge badge-amber";
    return "badge badge-red";
  };

  return (
    <div className="card p-4 space-y-3 flex flex-col justify-between">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-semibold" style={{ color: "var(--text)" }}>{title}</h4>
          {status === "completed" && score !== null ? (
            <span className={`font-mono font-bold text-xs ${getBadgeClass(score)}`}>
              {score}%
            </span>
          ) : status === "skipped" ? (
            <span className="badge badge-amber text-[10px] uppercase font-mono">
              <AlertTriangle className="w-3 h-3" />
              Skipped
            </span>
          ) : (
            <span className="badge badge-muted text-[10px] uppercase font-mono">
              <MinusCircle className="w-3 h-3" />
              Pending
            </span>
          )}
        </div>

        <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{description}</p>
      </div>

      {reason && (
        <div className="pt-2 border-t text-[11px] font-mono flex items-start gap-1.5" style={{ borderColor: "var(--border)", color: "var(--warning)" }}>
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{reason}</span>
        </div>
      )}
    </div>
  );
}
