"use client";

import React from "react";
import { CheckCircle2, Loader2, Circle } from "lucide-react";

const MODULES = [
  "Engineering Analysis",
  "Product Understanding",
  "UX Validation",
  "Performance Audit",
  "Business Review",
  "Launch Planner",
];

interface ProgressTrackerProps {
  currentModule: string | null;
  status: string;
}

export default function ProgressTracker({ currentModule, status }: ProgressTrackerProps) {
  const currentIndex = currentModule ? MODULES.indexOf(currentModule) : status === "completed" ? 6 : 0;

  return (
    <div className="bg-[#16181B] border border-[#2A2D31] rounded-[6px] p-6 space-y-5">
      <div className="flex items-center justify-between border-b border-[#2A2D31] pb-3">
        <h3 className="text-sm font-medium text-[#EDEDEF] uppercase font-mono tracking-wider">
          Analysis Pipeline Progress
        </h3>
        <span className="text-xs font-mono text-[#D97B3F] bg-[#D97B3F]/10 px-2 py-0.5 rounded border border-[#D97B3F]/20">
          {status === "completed" ? "Completed (6/6)" : status === "running" ? `Executing...` : "Pending"}
        </span>
      </div>

      <div className="space-y-4">
        {MODULES.map((modName, idx) => {
          const isCompleted = idx < currentIndex || status === "completed";
          const isCurrent = idx === currentIndex && status === "running";

          return (
            <div
              key={modName}
              className={`flex items-center gap-3 transition-all ${
                isCurrent
                  ? "text-[#EDEDEF] font-medium"
                  : isCompleted
                  ? "text-[#8B8F97]"
                  : "opacity-40 text-[#8B8F97]"
              }`}
            >
              <div className="flex-shrink-0">
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-[#5FA88A]" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 text-[#D97B3F] animate-spin" />
                ) : (
                  <Circle className="w-4 h-4 text-[#2A2D31]" />
                )}
              </div>

              <div className="flex-1 flex items-center justify-between text-sm">
                <span className="font-sans">{modName}</span>
                <span className="font-mono text-xs text-[#8B8F97]">
                  {isCompleted ? "Done" : isCurrent ? "Running..." : "Queued"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
