"use client";

import React from "react";
import { RoadmapItem } from "@/lib/types/schema";
import { Clock, CheckSquare } from "lucide-react";

interface RoadmapSectionProps {
  items: RoadmapItem[];
}

export default function RoadmapSection({ items }: RoadmapSectionProps) {
  const getBadgeClass = (p: string) => {
    switch (p) {
      case "critical": return "badge badge-red";
      case "high": return "badge badge-amber";
      case "medium": return "badge badge-yellow";
      default: return "badge badge-green";
    }
  };

  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border)" }}>
        <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text)" }}>
          <CheckSquare className="w-4 h-4" style={{ color: "var(--accent)" }} />
          Prioritized Launch Roadmap
        </h3>
        <span className="badge badge-muted font-mono">
          {items.length} tasks
        </span>
      </div>

      <div className="space-y-2">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between gap-4 p-3.5 rounded-xl border transition-all"
            style={{ background: "var(--bg)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="font-mono text-xs font-semibold w-5" style={{ color: "var(--accent)" }}>
                0{idx + 1}
              </span>
              <span className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>
                {item.title}
              </span>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <span className={`font-mono font-semibold uppercase text-[10px] ${getBadgeClass(item.priority)}`}>
                {item.priority}
              </span>

              <div className="flex items-center gap-1 text-xs font-mono px-2 py-1 rounded-md border" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
                <Clock className="w-3 h-3" style={{ color: "var(--accent)" }} />
                {item.estimatedEffort}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
