"use client";

import React from "react";
import { RoadmapItem } from "@/lib/types/schema";
import { Clock, CheckSquare } from "lucide-react";

interface RoadmapSectionProps {
  items: RoadmapItem[];
}

export default function RoadmapSection({ items }: RoadmapSectionProps) {
  const getBadgeColor = (p: string) => {
    switch (p) {
      case "critical":
        return "text-[#C25A4D] bg-[#C25A4D]/10 border-[#C25A4D]/20";
      case "high":
        return "text-[#C9A44C] bg-[#C9A44C]/10 border-[#C9A44C]/20";
      case "medium":
        return "text-[#6E7B8B] bg-[#6E7B8B]/10 border-[#6E7B8B]/20";
      default:
        return "text-[#5FA88A] bg-[#5FA88A]/10 border-[#5FA88A]/20";
    }
  };

  return (
    <div className="bg-[#16181B] border border-[#2A2D31] rounded-[6px] p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-[#2A2D31] pb-3">
        <h3 className="text-sm font-medium text-[#EDEDEF] uppercase font-mono tracking-wider flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-[#D97B3F]" />
          Prioritized Launch Roadmap
        </h3>
        <span className="text-xs font-mono text-[#8B8F97]">
          {items.length} prioritized tasks
        </span>
      </div>

      <div className="space-y-3">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between gap-4 p-3 bg-[#0B0C0E] border border-[#2A2D31] rounded-[6px]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="font-mono text-xs text-[#8B8F97] font-semibold w-5">
                0{idx + 1}
              </span>
              <span className="text-sm text-[#EDEDEF] truncate font-medium">
                {item.title}
              </span>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold border ${getBadgeColor(
                  item.priority
                )}`}
              >
                {item.priority}
              </span>

              <div className="flex items-center gap-1 text-xs font-mono text-[#8B8F97] bg-[#16181B] px-2 py-0.5 rounded border border-[#2A2D31]">
                <Clock className="w-3 h-3 text-[#D97B3F]" />
                {item.estimatedEffort}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
