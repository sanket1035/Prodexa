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
  Lightbulb, ArrowRight, Download, FileCode2,
  Layers, Network, Calendar, CheckCircle2,
  GitCompare, Plus, Minus, Check,
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
        if (data.success && data.blueprint) setBlueprint(data.blueprint);
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
      const res = await fetch(`/api/blueprint/${blueprint.id}/convert`, { method: "POST" });
      const data = await res.json();
      if (data.success && data.projectId) router.push(`/dashboard/${data.projectId}`);
    } catch (e) { console.error("Conversion error:", e); }
    finally { setConverting(false); }
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
      <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto w-full">
        <div className="skeleton h-10 w-80 rounded-xl" />
        <div className="skeleton h-6 w-full max-w-xl rounded-xl" />
        <div className="skeleton h-40 rounded-2xl" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  if (!blueprint) {
    return (
      <div className="p-12 text-center text-[#71717A] text-sm animate-fade-in">
        Blueprint document not found or expired.
      </div>
    );
  }

  const roadmapData = blueprint.sections.find((s) => s.category === "risks")?.content?.developmentPhases || [
    { phase: "Phase 1", title: "Idea Blueprint & System Architecture", effort: "4 hrs" },
    { phase: "Phase 2", title: "Core MVP UI & Backend Endpoints", effort: "8 hrs" },
    { phase: "Phase 3", title: "Testing & Launch Readiness Audit", effort: "4 hrs" },
  ];

  const TABS = [
    { id: "overview", label: "Overview", icon: Layers },
    { id: "architecture", label: "Architecture", icon: Network },
    { id: "roadmap", label: "Roadmap", icon: Calendar },
    { id: "export", label: "Export", icon: FileCode2 },
  ];

  return (
    <div className="p-5 md:p-7 space-y-6 max-w-6xl mx-auto w-full animate-fade-in">
      {/* ── Top Header ── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 border-b border-white/[0.08] pb-6">
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-8 h-8 bg-[#D97706]/10 border border-[#D97706]/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-4 h-4 text-[#D97706]" />
            </div>
            <h1 className="text-xl font-semibold text-[#FAFAFA] tracking-tight truncate">{blueprint.name}</h1>
            <span className="text-[10px] font-mono uppercase tracking-widest bg-[#D97706]/10 text-[#D97706] px-2.5 py-1 rounded-lg border border-[#D97706]/20 flex-shrink-0">
              AI Blueprint
            </span>
          </div>
          <p className="text-sm text-[#71717A] max-w-2xl leading-relaxed">{blueprint.idea}</p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap flex-shrink-0">
          <button
            onClick={() => setShowVersionDiff(!showVersionDiff)}
            className="flex items-center gap-1.5 bg-[#18181B] hover:bg-[#1C1C1F] border border-white/[0.10] text-[#A1A1AA] hover:text-[#FAFAFA] px-3.5 py-2 rounded-lg text-xs font-medium transition-all"
          >
            <GitCompare className="w-3.5 h-3.5 text-[#D97706]" />
            {showVersionDiff ? "Hide Diff" : "Compare Versions"}
          </button>

          <button
            onClick={handleDownloadStarterKit}
            className="flex items-center gap-1.5 bg-[#18181B] hover:bg-[#1C1C1F] border border-white/[0.10] text-[#A1A1AA] hover:text-[#FAFAFA] px-3.5 py-2 rounded-lg text-xs font-medium transition-all"
          >
            <Download className="w-3.5 h-3.5 text-[#22C55E]" />
            Starter Kit
          </button>

          <button
            onClick={handleAcceptAndLaunch}
            disabled={converting}
            className="flex items-center gap-2 bg-[#D97706] hover:bg-[#F59E0B] text-[#09090B] px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:shadow-[0_0_12px_rgba(217,119,6,0.3)] disabled:opacity-50"
          >
            {converting ? (
              <span>Binding Context...</span>
            ) : (
              <>
                Accept & Launch Audit
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Version Diff ── */}
      {showVersionDiff && (
        <div className="bg-[#111113] border border-[#D97706]/20 rounded-2xl p-5 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
            <div className="flex items-center gap-2 text-[#D97706] font-semibold text-sm">
              <GitCompare className="w-4 h-4" />
              Blueprint Iteration Diff (v1.0 → v2.0)
            </div>
            <span className="text-[10px] uppercase bg-[#22C55E]/10 text-[#22C55E] px-2.5 py-1 rounded-lg border border-[#22C55E]/20 font-mono">
              Iterative Optimization
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="bg-[#18181B] border border-white/[0.07] p-4 rounded-xl space-y-2">
              <div className="text-[#71717A] font-semibold text-[11px] uppercase tracking-wider pb-2 border-b border-white/[0.07]">
                v1.0 — Initial Draft
              </div>
              <div className="space-y-1.5 text-[#71717A]">
                <div className="flex items-center gap-1.5"><Minus className="w-3 h-3 text-[#EF4444]/70" /> Initial problem statement draft</div>
                <div className="flex items-center gap-1.5"><Minus className="w-3 h-3 text-[#EF4444]/70" /> Generic 3-layer architecture</div>
                <div className="flex items-center gap-1.5"><Minus className="w-3 h-3 text-[#EF4444]/70" /> Monolithic database schema</div>
              </div>
            </div>
            <div className="bg-[#18181B] border border-[#22C55E]/20 p-4 rounded-xl space-y-2">
              <div className="text-[#22C55E] font-semibold text-[11px] uppercase tracking-wider pb-2 border-b border-[#22C55E]/20">
                v2.0 — Refined OS Specification
              </div>
              <div className="space-y-1.5 text-[#FAFAFA]">
                <div className="flex items-center gap-1.5 text-[#22C55E]"><Plus className="w-3 h-3" /> Bounded Context Memory + Firestore Rules</div>
                <div className="flex items-center gap-1.5 text-[#22C55E]"><Plus className="w-3 h-3" /> Auto-Generated Mermaid Architecture</div>
                <div className="flex items-center gap-1.5 text-[#22C55E]"><Plus className="w-3 h-3" /> One-Click Starter Kit (PRD, TRD, Schema)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Quality Score ── */}
      <QualityScoreBadge score={blueprint.qualityScore} />

      {/* ── Tabs ── */}
      <div className="border-b border-white/[0.08] flex items-center gap-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id as any;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-medium transition-all relative ${
                isActive ? "text-[#FAFAFA]" : "text-[#71717A] hover:text-[#A1A1AA]"
              }`}
            >
              {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D97706] rounded-t-full" />}
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#D97706]" : ""}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB: OVERVIEW ── */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#FAFAFA]">
              Blueprint Sections
              <span className="ml-2 text-[11px] font-mono text-[#71717A] bg-white/[0.05] px-2 py-0.5 rounded-lg">{blueprint.sections.length}</span>
            </h3>
            <span className="text-xs text-[#71717A]">Click any section to expand and edit</span>
          </div>
          <div className="space-y-3">
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

      {/* ── TAB: ARCHITECTURE ── */}
      {activeTab === "architecture" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-[#D97706]" />
            <h3 className="text-sm font-semibold text-[#FAFAFA]">System Architecture Diagram</h3>
          </div>
          <div className="bg-[#111113] border border-white/[0.08] rounded-2xl overflow-hidden">
            <MermaidDiagram chart={blueprint.mermaidDiagram} />
          </div>
        </div>
      )}

      {/* ── TAB: ROADMAP ── */}
      {activeTab === "roadmap" && (
        <div className="bg-[#111113] border border-white/[0.08] rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-white/[0.07] pb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#D97706]" />
              <h3 className="text-sm font-semibold text-[#FAFAFA]">Phased Development Timeline</h3>
            </div>
            <span className="text-xs text-[#71717A]">Estimated hackathon build milestones</span>
          </div>
          <div className="space-y-3">
            {roadmapData.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between gap-4 p-4 bg-[#18181B] border border-white/[0.07] hover:border-white/[0.12] rounded-xl transition-colors group">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-[#D97706] font-bold bg-[#D97706]/10 px-2.5 py-1 rounded-lg border border-[#D97706]/20 flex-shrink-0">
                    {item.phase || `Phase 0${idx + 1}`}
                  </span>
                  <span className="text-sm text-[#FAFAFA] font-medium group-hover:text-[#D97706] transition-colors">{item.title}</span>
                </div>
                <div className="text-xs font-mono text-[#71717A] bg-[#27272A] px-2.5 py-1 rounded-lg flex-shrink-0">
                  {item.effort}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB: EXPORT ── */}
      {activeTab === "export" && (
        <div className="space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-[#FAFAFA] mb-1">One-Click Starter Kit</h3>
            <p className="text-xs text-[#71717A]">
              Complete developer and investor documentation for <span className="text-[#A1A1AA]">{blueprint.name}</span>.
            </p>
          </div>

          {/* File Contents */}
          <div className="bg-[#111113] border border-white/[0.08] rounded-2xl p-5 space-y-3">
            <div className="text-[11px] text-[#D97706] font-mono font-semibold uppercase tracking-wider mb-3">Package Contents</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
              {["README.md", "PRD.md", "TRD.md", "schema.json", "api-spec.json", ".env.example"].map((file) => (
                <div key={file} className="flex items-center gap-2 bg-[#18181B] border border-white/[0.07] p-3 rounded-xl text-xs font-mono text-[#A1A1AA]">
                  <Check className="w-3.5 h-3.5 text-[#22C55E] flex-shrink-0" />
                  <span>{file}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Download Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#111113] border border-white/[0.08] rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-5 h-5 text-[#D97706]" />
                <div>
                  <div className="text-sm font-semibold text-[#FAFAFA]">Markdown Starter Kit</div>
                  <div className="text-xs text-[#71717A]">README, PRD, TRD, Schema, API Specs</div>
                </div>
              </div>
              <p className="text-xs text-[#71717A] leading-relaxed">
                Fully formatted documentation with Mermaid diagrams, ready for GitHub and Cursor integration.
              </p>
              <button
                onClick={handleDownloadStarterKit}
                className="w-full flex items-center justify-center gap-2 bg-[#D97706] hover:bg-[#F59E0B] text-[#09090B] font-semibold text-xs py-2.5 px-4 rounded-xl transition-all hover:shadow-[0_0_12px_rgba(217,119,6,0.3)]"
              >
                <Download className="w-3.5 h-3.5" />
                Download Starter Kit (.md)
              </button>
            </div>

            <div className="bg-[#111113] border border-white/[0.08] rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-5 h-5 text-[#22C55E]" />
                <div>
                  <div className="text-sm font-semibold text-[#FAFAFA]">Structured JSON Blueprint</div>
                  <div className="text-xs text-[#71717A]">Machine-readable context memory</div>
                </div>
              </div>
              <p className="text-xs text-[#71717A] leading-relaxed">
                Raw structured JSON for integration into Cursor, Devin, or custom AI tooling pipelines.
              </p>
              <button
                onClick={handleDownloadJSON}
                className="w-full flex items-center justify-center gap-2 bg-[#18181B] hover:bg-[#1C1C1F] border border-white/[0.10] text-[#FAFAFA] font-semibold text-xs py-2.5 px-4 rounded-xl transition-all"
              >
                <Download className="w-3.5 h-3.5 text-[#22C55E]" />
                Download Blueprint (.json)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
