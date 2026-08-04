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
    <div className="card p-6 space-y-5">
      <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border)" }}>
        <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
          Analysis Pipeline Progress
        </h3>
        <span className="badge badge-amber font-mono">
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
              className="flex items-center gap-3 transition-all"
              style={{
                color: isCurrent ? "var(--text)" : isCompleted ? "var(--text-secondary)" : "var(--text-faint)"
              }}
            >
              <div className="flex-shrink-0">
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4" style={{ color: "var(--success)" }} />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 anim-spin" style={{ color: "var(--accent)" }} />
                ) : (
                  <Circle className="w-4 h-4" style={{ color: "var(--border)" }} />
                )}
              </div>

              <div className="flex-1 flex items-center justify-between text-sm">
                <span className="font-medium">{modName}</span>
                <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
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
