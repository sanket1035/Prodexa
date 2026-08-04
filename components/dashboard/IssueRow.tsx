"use client";

import React, { useState } from "react";
import { Issue } from "@/lib/types/schema";
import { Copy, Check, ChevronDown, ChevronUp } from "lucide-react";

interface IssueRowProps {
  issue: Issue;
}

export default function IssueRow({ issue }: IssueRowProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(issue.fixText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSeverityBadgeClass = (sev: string) => {
    switch (sev) {
      case "critical":
        return "badge badge-red";
      case "high":
        return "badge badge-amber";
      case "medium":
        return "badge badge-yellow";
      case "low":
      default:
        return "badge badge-green";
    }
  };

  return (
    <div className="card overflow-hidden transition-all">
      <div
        onClick={() => setExpanded(!expanded)}
        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className={`font-mono font-semibold uppercase text-[10px] tracking-wider flex-shrink-0 ${getSeverityBadgeClass(issue.severity)}`}>
            {issue.severity}
          </span>

          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm truncate" style={{ color: "var(--text)" }}>
              {issue.title}
            </div>
            <div className="text-xs truncate mt-0.5" style={{ color: "var(--text-muted)" }}>
              {issue.description}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          <span className="badge badge-muted text-[10px] font-mono uppercase">
            {issue.category}
          </span>

          <button
            onClick={handleCopy}
            className="btn btn-secondary btn-sm"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" style={{ color: "var(--success)" }} />
                <span style={{ color: "var(--success)" }}>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} />
                <span style={{ color: "var(--accent)" }}>Copy Fix</span>
              </>
            )}
          </button>

          <div style={{ color: "var(--text-muted)" }}>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* Expanded Copy-Fix Drawer */}
      {expanded && (
        <div className="p-4 space-y-3 border-t" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between text-xs font-mono" style={{ color: "var(--text-muted)" }}>
            <span>Deterministic Copy-Fix Suggestion</span>
            <span>Click button above to copy</span>
          </div>

          <pre className="code-block whitespace-pre-wrap">
            {issue.fixText}
          </pre>
        </div>
      )}
    </div>
  );
}
