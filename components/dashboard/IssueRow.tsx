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

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "critical":
        return "bg-[#C25A4D]/10 text-[#C25A4D] border-[#C25A4D]/30";
      case "high":
        return "bg-[#C9A44C]/10 text-[#C9A44C] border-[#C9A44C]/30";
      case "medium":
        return "bg-[#6E7B8B]/10 text-[#6E7B8B] border-[#6E7B8B]/30";
      case "low":
      default:
        return "bg-[#5FA88A]/10 text-[#5FA88A] border-[#5FA88A]/30";
    }
  };

  return (
    <div className="bg-[#16181B] border border-[#2A2D31] hover:border-[#3A3E45] rounded-[6px] transition-colors overflow-hidden">
      <div
        onClick={() => setExpanded(!expanded)}
        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span
            className={`px-2.5 py-0.5 rounded-[4px] border text-[11px] font-mono font-semibold uppercase tracking-wider flex-shrink-0 ${getSeverityBadge(
              issue.severity
            )}`}
          >
            {issue.severity}
          </span>

          <div className="min-w-0 flex-1">
            <div className="font-medium text-sm text-[#EDEDEF] truncate">
              {issue.title}
            </div>
            <div className="text-xs text-[#8B8F97] truncate mt-0.5">
              {issue.description}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          <span className="text-[10px] font-mono text-[#8B8F97] uppercase bg-[#1E2124] px-2 py-0.5 rounded border border-[#2A2D31]">
            {issue.category}
          </span>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 bg-[#1E2124] hover:bg-[#25292E] text-[#D97B3F] hover:text-[#E88A4E] border border-[#2A2D31] px-3 py-1.5 rounded-[6px] text-xs font-mono transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#5FA88A]" />
                <span className="text-[#5FA88A]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Fix</span>
              </>
            )}
          </button>

          <div className="text-[#8B8F97]">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* Expanded Copy-Fix Drawer */}
      {expanded && (
        <div className="bg-[#0B0C0E] border-t border-[#2A2D31] p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-[#8B8F97]">
            <span>Deterministic Copy-Fix Suggestion</span>
            <span>Click button above to copy</span>
          </div>

          <pre className="bg-[#16181B] border border-[#2A2D31] p-3 rounded-[6px] text-xs font-mono text-[#EDEDEF] overflow-x-auto whitespace-pre-wrap">
            {issue.fixText}
          </pre>
        </div>
      )}
    </div>
  );
}
