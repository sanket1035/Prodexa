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
      <div className="p-12 text-center text-sm anim-fade" style={{ color: "var(--text-muted)" }}>
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
    <div className="p-5 md:p-7 space-y-6 max-w-6xl mx-auto w-full anim-fade">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 border-b pb-6" style={{ borderColor: "var(--border)" }}>
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(217,119,6,0.12)", border: "1px solid rgba(217,119,6,0.2)" }}>
              <Lightbulb className="w-4 h-4" style={{ color: "var(--accent)" }} />
            </div>
            <h1 className="text-xl font-semibold tracking-tight truncate" style={{ color: "var(--text)" }}>{blueprint.name}</h1>
            <span className="badge badge-amber font-mono text-[10px] uppercase flex-shrink-0">
              AI Blueprint
            </span>
          </div>
          <p className="text-sm max-w-2xl leading-relaxed" style={{ color: "var(--text-muted)" }}>{blueprint.idea}</p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap flex-shrink-0">
          <button
            onClick={() => setShowVersionDiff(!showVersionDiff)}
            className="btn btn-secondary btn-sm"
          >
            <GitCompare className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} />
            {showVersionDiff ? "Hide Diff" : "Compare Versions"}
          </button>

          <button
            onClick={handleDownloadStarterKit}
            className="btn btn-secondary btn-sm"
          >
            <Download className="w-3.5 h-3.5" style={{ color: "var(--success)" }} />
            Starter Kit
          </button>

          <button
            onClick={handleAcceptAndLaunch}
            disabled={converting}
            className="btn btn-primary btn-sm"
          >
            {converting ? (
              <span>Binding Context...</span>
            ) : (
              <>
                Accept &amp; Launch Audit
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Version Diff */}
      {showVersionDiff && (
        <div className="card p-5 space-y-4 anim-fade" style={{ borderColor: "rgba(217,119,6,0.3)" }}>
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2 font-semibold text-sm" style={{ color: "var(--accent)" }}>
              <GitCompare className="w-4 h-4" />
              Blueprint Iteration Diff (v1.0 → v2.0)
            </div>
            <span className="badge badge-green font-mono text-[10px] uppercase">
              Iterative Optimization
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="card p-4 space-y-2">
              <div className="font-semibold text-[11px] uppercase tracking-wider pb-2 border-b" style={{ color: "var(--text-muted)", borderColor: "var(--border)" }}>
                v1.0 — Initial Draft
              </div>
              <div className="space-y-1.5" style={{ color: "var(--text-muted)" }}>
                <div className="flex items-center gap-1.5"><Minus className="w-3 h-3 text-red-400" /> Initial problem statement draft</div>
                <div className="flex items-center gap-1.5"><Minus className="w-3 h-3 text-red-400" /> Generic 3-layer architecture</div>
                <div className="flex items-center gap-1.5"><Minus className="w-3 h-3 text-red-400" /> Monolithic database schema</div>
              </div>
            </div>
            <div className="card p-4 space-y-2 border-green-500/20">
              <div className="font-semibold text-[11px] uppercase tracking-wider pb-2 border-b" style={{ color: "var(--success)", borderColor: "var(--border)" }}>
                v2.0 — Refined OS Specification
              </div>
              <div className="space-y-1.5" style={{ color: "var(--text)" }}>
                <div className="flex items-center gap-1.5 text-green-500"><Plus className="w-3 h-3" /> Bounded Context Memory + Firestore Rules</div>
                <div className="flex items-center gap-1.5 text-green-500"><Plus className="w-3 h-3" /> Auto-Generated Mermaid Architecture</div>
                <div className="flex items-center gap-1.5 text-green-500"><Plus className="w-3 h-3" /> One-Click Starter Kit (PRD, TRD, Schema)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quality Score */}
      <QualityScoreBadge score={blueprint.qualityScore} />

      {/* Tabs */}
      <div className="tabs">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id as any;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`tab-btn ${isActive ? "active" : ""}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              Blueprint Sections
              <span className="ml-2 badge badge-muted font-mono">{blueprint.sections.length}</span>
            </h3>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Click any section to expand and edit</span>
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

      {/* TAB: ARCHITECTURE */}
      {activeTab === "architecture" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4" style={{ color: "var(--accent)" }} />
            <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>System Architecture Diagram</h3>
          </div>
          <div className="card overflow-hidden">
            <MermaidDiagram chart={blueprint.mermaidDiagram} />
          </div>
        </div>
      )}

      {/* TAB: ROADMAP */}
      {activeTab === "roadmap" && (
        <div className="card p-6 space-y-5">
          <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" style={{ color: "var(--accent)" }} />
              <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Phased Development Timeline</h3>
            </div>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Estimated hackathon build milestones</span>
          </div>
          <div className="space-y-3">
            {roadmapData.map((item: any, idx: number) => (
              <div key={idx} className="card p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="badge badge-amber font-mono font-bold">
                    {item.phase || `Phase 0${idx + 1}`}
                  </span>
                  <span className="text-sm font-medium" style={{ color: "var(--text)" }}>{item.title}</span>
                </div>
                <div className="text-xs font-mono px-2.5 py-1 rounded-md" style={{ background: "var(--surface)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                  {item.effort}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: EXPORT */}
      {activeTab === "export" && (
        <div className="space-y-5">
          <div>
            <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>One-Click Starter Kit</h3>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Complete developer and investor documentation for <span style={{ color: "var(--text-secondary)" }}>{blueprint.name}</span>.
            </p>
          </div>

          <div className="card p-5 space-y-3">
            <div className="text-[11px] font-mono font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--accent)" }}>Package Contents</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
              {["README.md", "PRD.md", "TRD.md", "schema.json", "api-spec.json", ".env.example"].map((file) => (
                <div key={file} className="card p-3 flex items-center gap-2 text-xs font-mono" style={{ color: "var(--text-secondary)" }}>
                  <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  <span>{file}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card p-5 space-y-4">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-5 h-5" style={{ color: "var(--accent)" }} />
                <div>
                  <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>Markdown Starter Kit</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>README, PRD, TRD, Schema, API Specs</div>
                </div>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Formatted documentation with Mermaid diagrams, ready for GitHub and Cursor integration.
              </p>
              <button
                onClick={handleDownloadStarterKit}
                className="btn btn-primary w-full"
              >
                <Download className="w-3.5 h-3.5" />
                Download Starter Kit (.md)
              </button>
            </div>

            <div className="card p-5 space-y-4">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-5 h-5 text-green-500" />
                <div>
                  <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>Structured JSON Blueprint</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>Machine-readable context memory</div>
                </div>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Raw structured JSON for integration into Cursor, Devin, or custom AI tooling pipelines.
              </p>
              <button
                onClick={handleDownloadJSON}
                className="btn btn-secondary w-full"
              >
                <Download className="w-3.5 h-3.5 text-green-500" />
                Download Blueprint (.json)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
