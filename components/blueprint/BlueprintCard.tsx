"use client";

import React, { useState } from "react";
import { BlueprintSection } from "@/lib/types/blueprint";
import { ChevronDown, ChevronUp, Edit3, CheckCircle2 } from "lucide-react";

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
    <div className="card overflow-hidden">
      {/* Header Bar */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="p-4 flex items-center justify-between gap-3 cursor-pointer select-none border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-3">
          <h4 className="font-semibold text-sm" style={{ color: "var(--text)" }}>{section.title}</h4>
          <span
            className={`font-mono text-[10px] uppercase font-semibold ${
              status === "accepted"
                ? "badge badge-green"
                : "badge badge-amber"
            }`}
          >
            {status}
          </span>
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="btn btn-secondary btn-sm"
          >
            <Edit3 className="w-3 h-3" style={{ color: "var(--accent)" }} />
            {isEditing ? "Cancel" : "Edit"}
          </button>

          <button
            onClick={handleAccept}
            className="btn btn-secondary btn-sm"
          >
            <CheckCircle2 className="w-3 h-3 text-green-500" />
            Accept
          </button>

          <button
            onClick={() => setExpanded(!expanded)}
            className="btn btn-ghost btn-sm"
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
              <div className="text-xs font-mono" style={{ color: "var(--accent)" }}>
                Edit JSON Content for {section.title}:
              </div>
              <textarea
                rows={10}
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                className="input textarea font-mono text-xs"
              />
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="btn btn-primary"
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
            <div className="text-xs font-mono uppercase font-semibold mb-1" style={{ color: "var(--accent)" }}>Problem Statement</div>
            <p className="leading-relaxed" style={{ color: "var(--text)" }}>{content.problemStatement}</p>
          </div>
          <div>
            <div className="text-xs font-mono uppercase font-semibold mb-1 text-green-500">Solution &amp; Core Value</div>
            <p className="leading-relaxed" style={{ color: "var(--text)" }}>{content.solutionStatement}</p>
          </div>
          <div>
            <div className="text-xs font-mono uppercase mb-1" style={{ color: "var(--text-muted)" }}>Target Ideal Customer Profile (ICP)</div>
            <p className="font-mono text-xs" style={{ color: "var(--text-secondary)" }}>{content.targetICP}</p>
          </div>
        </div>
      );

    case "market":
      return (
        <div className="space-y-4 text-sm">
          <div>
            <div className="text-xs font-mono uppercase font-semibold mb-2" style={{ color: "var(--accent)" }}>Competitor Analysis</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(content.competitors || []).map((c: any, idx: number) => (
                <div key={idx} className="card p-3 space-y-1 text-xs" style={{ background: "var(--bg)" }}>
                  <div className="font-semibold" style={{ color: "var(--text)" }}>{c.name}</div>
                  <div className="text-green-500 font-mono">Strength: {c.strength}</div>
                  <div className="text-red-400 font-mono">Weakness: {c.weakness}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-mono uppercase font-semibold mb-1" style={{ color: "var(--warning)" }}>Market Gaps</div>
            <p className="text-xs" style={{ color: "var(--text)" }}>{content.marketGaps}</p>
          </div>
        </div>
      );

    case "features":
      return (
        <div className="space-y-4 text-sm">
          <div>
            <div className="text-xs font-mono uppercase font-semibold mb-2 text-green-500">Core MVP Features</div>
            <ul className="space-y-1 text-xs font-mono" style={{ color: "var(--text)" }}>
              {(content.mvpFeatures || []).map((f: string, idx: number) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="text-green-500">✔</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
          {content.monetization && (
            <div>
              <div className="text-xs font-mono uppercase font-semibold mb-1" style={{ color: "var(--accent)" }}>Monetization Strategy</div>
              <p className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>{content.monetization}</p>
            </div>
          )}
        </div>
      );

    case "tech":
      return (
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
            <div className="card p-2.5" style={{ background: "var(--bg)" }}>
              <div style={{ color: "var(--text-muted)" }}>Frontend</div>
              <div className="font-semibold mt-0.5" style={{ color: "var(--text)" }}>{content.techStack?.frontend}</div>
            </div>
            <div className="card p-2.5" style={{ background: "var(--bg)" }}>
              <div style={{ color: "var(--text-muted)" }}>Backend</div>
              <div className="font-semibold mt-0.5" style={{ color: "var(--text)" }}>{content.techStack?.backend}</div>
            </div>
            <div className="card p-2.5" style={{ background: "var(--bg)" }}>
              <div style={{ color: "var(--text-muted)" }}>Database</div>
              <div className="font-semibold mt-0.5" style={{ color: "var(--text)" }}>{content.techStack?.database}</div>
            </div>
            <div className="card p-2.5" style={{ background: "var(--bg)" }}>
              <div style={{ color: "var(--text-muted)" }}>AI Engine</div>
              <div className="font-semibold mt-0.5" style={{ color: "var(--text)" }}>{content.techStack?.ai}</div>
            </div>
          </div>
        </div>
      );

    case "database":
      return (
        <div className="space-y-4 text-xs font-mono">
          <div>
            <div className="text-xs font-mono uppercase font-semibold mb-2" style={{ color: "var(--accent)" }}>Firestore Collections Schema</div>
            <div className="space-y-2">
              {(content.collections || []).map((col: any, idx: number) => (
                <div key={idx} className="card p-2.5 flex items-center justify-between" style={{ background: "var(--bg)" }}>
                  <span className="font-bold" style={{ color: "var(--text)" }}>{col.name}</span>
                  <span style={{ color: "var(--text-muted)" }}>{col.fields}</span>
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
              <div className="text-xs font-mono uppercase mb-1" style={{ color: "var(--text-muted)" }}>Production Directory Structure</div>
              <pre className="code-block whitespace-pre-wrap">
                {content.folderTree}
              </pre>
            </div>
          )}
        </div>
      );
  }
}
