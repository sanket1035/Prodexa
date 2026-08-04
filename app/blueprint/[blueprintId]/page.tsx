"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Blueprint, BlueprintSection } from "@/lib/types/blueprint";
import QualityScoreBadge from "@/components/blueprint/QualityScoreBadge";
import MermaidDiagram from "@/components/blueprint/MermaidDiagram";
import BlueprintCard from "@/components/blueprint/BlueprintCard";
import { generateStarterKitBundle, downloadFile } from "@/lib/pdf/exporter";

import {
  Lightbulb,
  ArrowRight,
  Download,
  FileCode2,
  Layers,
  Network,
  Calendar,
  CheckCircle2,
  Sparkles,
  GitCompare,
  Plus,
  Minus,
  Check,
} from "lucide-react";

export default function BlueprintWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const blueprintId = params.blueprintId as string;

  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "architecture" | "roadmap" | "export">("overview");
  const [showVersionDiff, setShowVersionDiff] = useState(false);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    if (!blueprintId) return;

    fetch(`/api/blueprint/${blueprintId}/section`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.blueprint) {
          setBlueprint(data.blueprint);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [blueprintId]);

  const handleUpdateSection = (sectionId: string, updatedContent: any) => {
    if (!blueprint) return;
    const updatedSections = blueprint.sections.map((sec) =>
      sec.id === sectionId ? { ...sec, content: updatedContent, status: "modified" as const } : sec
    );
    setBlueprint({ ...blueprint, sections: updatedSections });
  };

  const handleAcceptAndLaunch = async () => {
    if (!blueprint) return;
    setConverting(true);

    try {
      const res = await fetch(`/api/blueprint/${blueprint.id}/convert`, {
        method: "POST",
      });

      const data = await res.json();
      if (data.success && data.projectId) {
        router.push(`/dashboard/${data.projectId}`);
      }
    } catch (e) {
      console.error("Conversion error:", e);
    } finally {
      setConverting(false);
    }
  };

  const handleDownloadStarterKit = () => {
    if (!blueprint) return;
    const kitText = generateStarterKitBundle(blueprint);
    downloadFile(`${blueprint.name.toLowerCase().replace(/\s+/g, "-")}-starter-kit.md`, kitText, "text/markdown");
  };

  const handleDownloadJSON = () => {
    if (!blueprint) return;
    downloadFile(`${blueprint.name.toLowerCase().replace(/\s+/g, "-")}-blueprint.json`, JSON.stringify(blueprint, null, 2), "application/json");
  };

  if (loading) {
    return (
      <div className="p-8 space-y-8 max-w-6xl mx-auto w-full">
        <div className="h-10 w-64 bg-[#16181B] rounded animate-pulse" />
        <div className="h-64 bg-[#16181B] border border-[#2A2D31] rounded-[6px] animate-pulse" />
      </div>
    );
  }

  if (!blueprint) {
    return (
      <div className="p-12 text-center text-[#8B8F97] font-mono">
        Blueprint document not found or expired.
      </div>
    );
  }

  const roadmapData = blueprint.sections.find((s) => s.category === "risks")?.content?.developmentPhases || [
    { phase: "Phase 1", title: "Idea Blueprint & System Architecture", effort: "4 hrs" },
    { phase: "Phase 2", title: "Core MVP UI & Backend Endpoints", effort: "8 hrs" },
    { phase: "Phase 3", title: "Testing & Launch Readiness Audit", effort: "4 hrs" },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#2A2D31] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-[#D97B3F]/10 border border-[#D97B3F]/30 rounded-[4px] flex items-center justify-center text-[#D97B3F]">
              <Lightbulb className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-medium text-[#EDEDEF] tracking-tight">{blueprint.name}</h1>
            <span className="text-xs font-mono uppercase bg-[#1E2124] text-[#D97B3F] px-2.5 py-0.5 rounded border border-[#2A2D31]">
              AI Product Blueprint
            </span>
          </div>
          <p className="text-xs text-[#8B8F97] font-mono mt-1 max-w-2xl truncate">
            {blueprint.idea}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowVersionDiff(!showVersionDiff)}
            className="flex items-center gap-1.5 bg-[#16181B] hover:bg-[#1E2124] text-[#EDEDEF] border border-[#2A2D31] px-3.5 py-2 rounded-[6px] text-xs font-mono transition-colors"
          >
            <GitCompare className="w-3.5 h-3.5 text-[#D97B3F]" />
            {showVersionDiff ? "Hide Version Diff" : "Compare Versions (v1 vs v2)"}
          </button>

          <button
            onClick={handleDownloadStarterKit}
            className="flex items-center gap-1.5 bg-[#16181B] hover:bg-[#1E2124] text-[#EDEDEF] border border-[#2A2D31] px-3.5 py-2 rounded-[6px] text-xs font-mono transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#5FA88A]" />
            Starter Kit Bundle
          </button>

          <button
            onClick={handleAcceptAndLaunch}
            disabled={converting}
            className="flex items-center gap-2 bg-[#D97B3F] hover:bg-[#E88A4E] text-[#0B0C0E] px-4 py-2 rounded-[6px] text-xs font-mono font-medium transition-colors disabled:opacity-50"
          >
            {converting ? (
              <span>Binding Context Memory...</span>
            ) : (
              <>
                <span>Accept & Launch Audit</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Compare Blueprint Versions Diff Card */}
      {showVersionDiff && (
        <div className="bg-[#16181B] border border-[#D97B3F]/40 rounded-[6px] p-5 space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-[#2A2D31] pb-3">
            <div className="flex items-center gap-2 text-[#D97B3F] font-bold text-sm">
              <GitCompare className="w-4 h-4" />
              Blueprint Iteration Diff (v1.0 Initial Draft vs v2.0 Refined OS)
            </div>
            <span className="text-[10px] uppercase bg-[#5FA88A]/10 text-[#5FA88A] px-2 py-0.5 rounded border border-[#5FA88A]/20">
              Iterative Optimization
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0B0C0E] border border-[#2A2D31] p-4 rounded space-y-2">
              <div className="text-[#8B8F97] font-semibold text-[11px] border-b border-[#2A2D31] pb-1">
                Version 1.0 (Initial Raw Prompt Output)
              </div>
              <div className="text-[#8B8F97] space-y-1">
                <div>• Initial problem statement draft</div>
                <div>• Generic 3-layer architecture</div>
                <div>• Monolithic database schema</div>
              </div>
            </div>

            <div className="bg-[#0B0C0E] border border-[#5FA88A]/30 p-4 rounded space-y-2">
              <div className="text-[#5FA88A] font-semibold text-[11px] border-b border-[#2A2D31] pb-1">
                Version 2.0 (Refined Product OS Specification)
              </div>
              <div className="space-y-1 text-[#EDEDEF]">
                <div className="flex items-center gap-1.5 text-[#5FA88A]">
                  <Plus className="w-3 h-3" />
                  <span>Added Bounded Context Memory & Firestore Rules</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#5FA88A]">
                  <Plus className="w-3 h-3" />
                  <span>Auto-Generated Mermaid Architecture Diagram</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#5FA88A]">
                  <Plus className="w-3 h-3" />
                  <span>One-Click Starter Kit Downloader (PRD, TRD, Schema)</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#C25A4D]">
                  <Minus className="w-3 h-3" />
                  <span>Removed Non-Essential Prompt Viewer Sandbox</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Blueprint Quality Score Badge (WOW Moment 1) */}
      <QualityScoreBadge score={blueprint.qualityScore} />

      {/* 4 Focused MVP Navigation Tabs */}
      <div className="border-b border-[#2A2D31] flex items-center gap-2">
        {[
          { id: "overview", label: "Overview", icon: Layers },
          { id: "architecture", label: "Architecture Diagram", icon: Network },
          { id: "roadmap", label: "Development Roadmap", icon: Calendar },
          { id: "export", label: "Export & Starter Kit", icon: FileCode2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-mono uppercase tracking-wider font-semibold transition-colors ${
                isActive
                  ? "border-[#D97B3F] text-[#D97B3F] bg-[#D97B3F]/5"
                  : "border-transparent text-[#8B8F97] hover:text-[#EDEDEF]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW (Expandable Module Accordions) */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-[#EDEDEF] uppercase font-mono tracking-wider">
              Consolidated Blueprint Power Modules ({blueprint.sections.length})
            </h3>
            <span className="text-xs font-mono text-[#8B8F97]">
              Click any section to expand, edit, or accept.
            </span>
          </div>

          <div className="space-y-4">
            {blueprint.sections.map((sec) => (
              <BlueprintCard
                key={sec.id}
                section={sec}
                blueprintId={blueprint.id}
                onUpdateSection={handleUpdateSection}
              />
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: ARCHITECTURE (Auto-Generated Mermaid Diagram) */}
      {activeTab === "architecture" && (
        <div className="space-y-4">
          <MermaidDiagram chart={blueprint.mermaidDiagram} />
        </div>
      )}

      {/* TAB 3: ROADMAP (Phased Timeline) */}
      {activeTab === "roadmap" && (
        <div className="bg-[#16181B] border border-[#2A2D31] rounded-[6px] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#2A2D31] pb-3">
            <h3 className="text-sm font-medium text-[#EDEDEF] uppercase font-mono tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#D97B3F]" />
              Phased Development Timeline
            </h3>
            <span className="text-xs font-mono text-[#8B8F97]">
              Estimated hackathon build milestones
            </span>
          </div>

          <div className="space-y-3">
            {roadmapData.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between gap-4 p-4 bg-[#0B0C0E] border border-[#2A2D31] rounded-[6px]">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-[#D97B3F] font-bold bg-[#D97B3F]/10 px-2 py-0.5 rounded border border-[#D97B3F]/20">
                    {item.phase || `Phase 0${idx + 1}`}
                  </span>
                  <span className="text-sm text-[#EDEDEF] font-medium">{item.title}</span>
                </div>

                <div className="text-xs font-mono text-[#8B8F97] bg-[#16181B] px-2.5 py-1 rounded border border-[#2A2D31]">
                  Est. Effort: {item.effort}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: EXPORT & STARTER KIT (With Visual File Checklist) */}
      {activeTab === "export" && (
        <div className="bg-[#16181B] border border-[#2A2D31] rounded-[6px] p-6 space-y-6">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-[#EDEDEF] uppercase font-mono tracking-wider">
              Download One-Click Starter Kit Package
            </h3>
            <p className="text-xs text-[#8B8F97]">
              Download complete investor & developer documentation for {blueprint.name}.
            </p>
          </div>

          {/* Visual File Checklist */}
          <div className="bg-[#0B0C0E] border border-[#2A2D31] rounded-[6px] p-4 space-y-2 font-mono text-xs">
            <div className="text-[11px] text-[#D97B3F] font-bold uppercase tracking-wider mb-2">
              Generated Starter Kit Package Contents:
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                "README.md ✔",
                "PRD.md ✔",
                "TRD.md ✔",
                "schema.json ✔",
                "api-spec.json ✔",
                ".env.example ✔",
              ].map((file, i) => (
                <div key={i} className="flex items-center gap-2 bg-[#16181B] border border-[#2A2D31] p-2 rounded text-[#EDEDEF]">
                  <Check className="w-3.5 h-3.5 text-[#5FA88A]" />
                  <span>{file}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0B0C0E] border border-[#2A2D31] p-5 rounded-[6px] space-y-3">
              <div className="flex items-center gap-2 font-mono text-sm text-[#D97B3F]">
                <FileCode2 className="w-4 h-4" />
                <span>Markdown Starter Kit Bundle</span>
              </div>
              <p className="text-xs text-[#8B8F97] leading-relaxed">
                Includes README.md, PRD.md, TRD.md with Mermaid diagrams, Firestore schema.json, and API specs.
              </p>
              <button
                onClick={handleDownloadStarterKit}
                className="w-full flex items-center justify-center gap-2 bg-[#D97B3F] hover:bg-[#E88A4E] text-[#0B0C0E] font-medium py-2 px-4 rounded-[6px] text-xs font-mono transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download Starter Kit (.md)
              </button>
            </div>

            <div className="bg-[#0B0C0E] border border-[#2A2D31] p-5 rounded-[6px] space-y-3">
              <div className="flex items-center gap-2 font-mono text-sm text-[#5FA88A]">
                <FileCode2 className="w-4 h-4" />
                <span>Structured JSON Context Memory</span>
              </div>
              <p className="text-xs text-[#8B8F97] leading-relaxed">
                Export raw structured JSON blueprint data for integration into Cursor, Devin, or custom tools.
              </p>
              <button
                onClick={handleDownloadJSON}
                className="w-full flex items-center justify-center gap-2 bg-[#16181B] hover:bg-[#1E2124] text-[#EDEDEF] border border-[#2A2D31] font-medium py-2 px-4 rounded-[6px] text-xs font-mono transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download Blueprint (.json)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
