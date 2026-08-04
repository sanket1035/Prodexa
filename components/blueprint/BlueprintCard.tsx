"use client";

import React, { useState } from "react";
import { BlueprintSection } from "@/lib/types/blueprint";
import { ChevronDown, ChevronUp, Edit3, RefreshCw, CheckCircle2 } from "lucide-react";

interface BlueprintCardProps {
  section: BlueprintSection;
  blueprintId: string;
  onUpdateSection?: (sectionId: string, updatedContent: any) => void;
}

export default function BlueprintCard({
  section,
  blueprintId,
  onUpdateSection,
}: BlueprintCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [jsonText, setJsonText] = useState(JSON.stringify(section.content, null, 2));
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(section.status);

  const handleSaveEdit = async () => {
    try {
      const parsed = JSON.parse(jsonText);
      setSaving(true);

      const res = await fetch(`/api/blueprint/${blueprintId}/section`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionId: section.id,
          content: parsed,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatus("modified");
        if (onUpdateSection) onUpdateSection(section.id, parsed);
        setIsEditing(false);
      }
    } catch {
      alert("Invalid JSON format. Please format as valid JSON.");
    } finally {
      setSaving(false);
    }
  };

  const handleAccept = () => {
    setStatus("accepted");
  };

  return (
    <div className="bg-[#16181B] border border-[#2A2D31] hover:border-[#3A3E45] rounded-[6px] transition-colors overflow-hidden">
      {/* Header Bar */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="p-4 flex items-center justify-between gap-3 cursor-pointer select-none border-b border-[#2A2D31]/50"
      >
        <div className="flex items-center gap-3">
          <h4 className="font-medium text-base text-[#EDEDEF]">{section.title}</h4>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold border ${
              status === "accepted"
                ? "bg-[#5FA88A]/10 text-[#5FA88A] border-[#5FA88A]/20"
                : "bg-[#C9A44C]/10 text-[#C9A44C] border-[#C9A44C]/20"
            }`}
          >
            {status}
          </span>
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1 bg-[#1E2124] hover:bg-[#25292E] text-[#EDEDEF] border border-[#2A2D31] px-2.5 py-1 rounded-[6px] text-xs font-mono transition-colors"
          >
            <Edit3 className="w-3 h-3 text-[#D97B3F]" />
            {isEditing ? "Cancel" : "Edit"}
          </button>

          <button
            onClick={handleAccept}
            className="flex items-center gap-1 bg-[#1E2124] hover:bg-[#25292E] text-[#5FA88A] border border-[#2A2D31] px-2.5 py-1 rounded-[6px] text-xs font-mono transition-colors"
          >
            <CheckCircle2 className="w-3 h-3" />
            Accept
          </button>

          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 text-[#8B8F97] hover:text-[#EDEDEF]"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Content Body */}
      {expanded && (
        <div className="p-5 space-y-4">
          {isEditing ? (
            <div className="space-y-3">
              <div className="text-xs font-mono text-[#D97B3F]">
                Edit JSON Content for {section.title}:
              </div>
              <textarea
                rows={10}
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                className="w-full bg-[#0B0C0E] border border-[#2A2D31] rounded-[6px] p-3 text-xs font-mono text-[#EDEDEF] focus:border-[#D97B3F] outline-none"
              />
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="bg-[#D97B3F] hover:bg-[#E88A4E] text-[#0B0C0E] font-medium px-4 py-1.5 rounded-[6px] text-xs font-mono transition-colors"
              >
                {saving ? "Saving..." : "Save Section Content"}
              </button>
            </div>
          ) : (
            <RenderSectionContent category={section.category} content={section.content} />
          )}
        </div>
      )}
    </div>
  );
}

function RenderSectionContent({ category, content }: { category: string; content: any }) {
  if (!content) return null;

  switch (category) {
    case "foundation":
      return (
        <div className="space-y-3 text-sm">
          <div>
            <div className="text-xs font-mono uppercase text-[#D97B3F] mb-1">Problem Statement</div>
            <p className="text-[#EDEDEF] leading-relaxed">{content.problemStatement}</p>
          </div>
          <div>
            <div className="text-xs font-mono uppercase text-[#5FA88A] mb-1">Solution & Core Value</div>
            <p className="text-[#EDEDEF] leading-relaxed">{content.solutionStatement}</p>
          </div>
          <div>
            <div className="text-xs font-mono uppercase text-[#6E7B8B] mb-1">Target Ideal Customer Profile (ICP)</div>
            <p className="text-[#8B8F97] font-mono text-xs">{content.targetICP}</p>
          </div>
        </div>
      );

    case "market":
      return (
        <div className="space-y-4 text-sm">
          <div>
            <div className="text-xs font-mono uppercase text-[#D97B3F] mb-2">Competitor Analysis</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(content.competitors || []).map((c: any, idx: number) => (
                <div key={idx} className="bg-[#0B0C0E] border border-[#2A2D31] p-3 rounded-[6px] space-y-1 text-xs">
                  <div className="font-semibold text-[#EDEDEF]">{c.name}</div>
                  <div className="text-[#5FA88A]">Strength: {c.strength}</div>
                  <div className="text-[#C25A4D]">Weakness: {c.weakness}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-mono uppercase text-[#C9A44C] mb-1">Market Gaps</div>
            <p className="text-[#EDEDEF] text-xs">{content.marketGaps}</p>
          </div>
        </div>
      );

    case "features":
      return (
        <div className="space-y-4 text-sm">
          <div>
            <div className="text-xs font-mono uppercase text-[#5FA88A] mb-2">Core MVP Features</div>
            <ul className="space-y-1 text-xs text-[#EDEDEF] font-mono">
              {(content.mvpFeatures || []).map((f: string, idx: number) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="text-[#5FA88A]">✔</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
          {content.monetization && (
            <div>
              <div className="text-xs font-mono uppercase text-[#D97B3F] mb-1">Monetization Strategy</div>
              <p className="text-[#8B8F97] text-xs font-mono">{content.monetization}</p>
            </div>
          )}
        </div>
      );

    case "tech":
      return (
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
            <div className="bg-[#0B0C0E] border border-[#2A2D31] p-2.5 rounded">
              <div className="text-[#8B8F97]">Frontend</div>
              <div className="text-[#EDEDEF] font-semibold mt-0.5">{content.techStack?.frontend}</div>
            </div>
            <div className="bg-[#0B0C0E] border border-[#2A2D31] p-2.5 rounded">
              <div className="text-[#8B8F97]">Backend</div>
              <div className="text-[#EDEDEF] font-semibold mt-0.5">{content.techStack?.backend}</div>
            </div>
            <div className="bg-[#0B0C0E] border border-[#2A2D31] p-2.5 rounded">
              <div className="text-[#8B8F97]">Database</div>
              <div className="text-[#EDEDEF] font-semibold mt-0.5">{content.techStack?.database}</div>
            </div>
            <div className="bg-[#0B0C0E] border border-[#2A2D31] p-2.5 rounded">
              <div className="text-[#8B8F97]">AI Engine</div>
              <div className="text-[#EDEDEF] font-semibold mt-0.5">{content.techStack?.ai}</div>
            </div>
          </div>
        </div>
      );

    case "database":
      return (
        <div className="space-y-4 text-xs font-mono">
          <div>
            <div className="text-xs font-mono uppercase text-[#D97B3F] mb-2">Firestore Collections Schema</div>
            <div className="space-y-2">
              {(content.collections || []).map((col: any, idx: number) => (
                <div key={idx} className="bg-[#0B0C0E] border border-[#2A2D31] p-2.5 rounded flex items-center justify-between">
                  <span className="text-[#EDEDEF] font-bold">{col.name}</span>
                  <span className="text-[#8B8F97]">{col.fields}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case "risks":
    default:
      return (
        <div className="space-y-4 text-xs font-mono">
          {content.folderTree && (
            <div>
              <div className="text-xs font-mono uppercase text-[#6E7B8B] mb-1">Production Directory Structure</div>
              <pre className="bg-[#0B0C0E] border border-[#2A2D31] p-3 rounded text-[#EDEDEF]">
                {content.folderTree}
              </pre>
            </div>
          )}
        </div>
      );
  }
}
