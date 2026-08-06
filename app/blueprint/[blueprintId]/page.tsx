"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Blueprint, BlueprintSection } from "@/lib/types/blueprint";
import QualityScoreBadge from "@/components/blueprint/QualityScoreBadge";
import MermaidDiagram from "@/components/blueprint/MermaidDiagram";
import BlueprintCard from "@/components/blueprint/BlueprintCard";
import { generateStarterKitBundle, downloadFile } from "@/lib/pdf/exporter";
import { auditCrossModuleConsistency, ConsistencyReport } from "@/lib/modules/consistency-engine";

import {
  Lightbulb, ArrowRight, Download, FileCode2,
  Layers, Network, Calendar, CheckCircle2,
  GitCompare, Plus, Minus, Check, ShieldCheck, AlertTriangle, Cpu
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
  const [consistencyReport, setConsistencyReport] = useState<ConsistencyReport | null>(null);

  useEffect(() => {
    if (!blueprintId) return;
    fetch(`/api/blueprint/${blueprintId}/section`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.blueprint) {
          setBlueprint(data.blueprint);
          const bp = data.blueprint;
          const tech = bp.sections.find((s: any) => s.category === "tech")?.content || {};
          const features = bp.sections.find((s: any) => s.category === "features")?.content || {};
          const db = bp.sections.find((s: any) => s.category === "database")?.content || {};

          const report = auditCrossModuleConsistency(
            tech.techStack || bp.contextPackage?.techStack || { frontend: "Next.js 14", backend: "Next.js API", database: "Firestore", ai: "Gemini" },
            features.mvpFeatures || bp.contextPackage?.coreFeatures || [],
            db.collections || [],
            bp.mermaidDiagram || "",
            bp.idea || ""
          );
          setConsistencyReport(report);
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
      const res = await fetch(`/api/blueprint/${blueprint.id}/convert`, { method: "POST" });
      const data = await res.json();
      if (data.success && data.projectId) router.push(`/dashboard/${data.projectId}`);
    } catch (e) { console.error("Conversion error:", e); }
    finally { setConverting(false); }
  };

  const handleDownloadStarterKit = () => {
    if (!blueprint) return;
    const bundleText = generateStarterKitBundle(blueprint);
    downloadFile(`${blueprint.name.toLowerCase().replace(/\s+/g, "-")}-starterkit.md`, bundleText, "text/markdown");
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto w-full">
        <div className="skeleton h-10 w-72 rounded-xl" />
        <div className="skeleton h-6 w-96 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="skeleton h-52 rounded-2xl" />
          <div className="skeleton h-52 md:col-span-2 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!blueprint) {
    return (
      <div className="p-12 text-center space-y-4 anim-fade">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <Lightbulb className="w-7 h-7 text-muted" />
        </div>
        <div className="text-sm text-muted">Blueprint record not found.</div>
        <Link href="/blueprint/new" className="btn btn-primary">
          + Create New Blueprint
        </Link>
      </div>
    );
  }

  const foundation = blueprint.sections.find((s) => s.category === "foundation")?.content || {};
  const market = blueprint.sections.find((s) => s.category === "market")?.content || {};
  const features = blueprint.sections.find((s) => s.category === "features")?.content || {};
  const tech = blueprint.sections.find((s) => s.category === "tech")?.content || {};
  const db = blueprint.sections.find((s) => s.category === "database")?.content || {};
  const risks = blueprint.sections.find((s) => s.category === "risks")?.content || {};

  return (
    <div className="p-5 md:p-7 space-y-6 max-w-6xl mx-auto w-full anim-fade font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b pb-5" style={{ borderColor: "var(--border)" }}>
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text)" }}>
              {blueprint.name}
            </h1>
            <span className="badge badge-amber font-mono text-[10px] uppercase">
              Blueprint Workspace
            </span>
            <span className="badge badge-muted text-[10px] font-mono uppercase">
              Deterministic + AI Verified
            </span>
          </div>

          <p className="text-xs leading-relaxed max-w-2xl" style={{ color: "var(--text-muted)" }}>
            {blueprint.idea}
          </p>
        </div>

        {/* Action CTAs */}
        <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
          <button
            onClick={handleDownloadStarterKit}
            className="btn btn-secondary btn-sm"
          >
            <Download className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} />
            Download Kit (.md)
          </button>

          <button
            onClick={handleAcceptAndLaunch}
            disabled={converting}
            className="btn btn-primary btn-sm"
          >
            {converting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full anim-spin" />
                Launching Workspace...
              </>
            ) : (
              <>
                <span>Accept &amp; Launch Audit</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Cross-Module Consistency Report Banner */}
      {consistencyReport && (
        <div className="card p-4 space-y-3" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2 font-mono text-xs font-semibold" style={{ color: "var(--accent)" }}>
              <ShieldCheck className="w-4 h-4 text-green-500" />
              Cross-Module Consistency Audit ({consistencyReport.overallConsistencyScore}% Consistent)
            </div>
            <span className="badge badge-muted text-[10px] font-mono">
              [Deterministic Validation]
            </span>
          </div>

          {consistencyReport.hasConflicts ? (
            <div className="space-y-2">
              {consistencyReport.conflicts.map((conf) => (
                <div key={conf.id} className="card p-3 space-y-1 text-xs" style={{ background: "var(--surface)", borderColor: "rgba(217,119,6,0.2)" }}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-amber-500 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {conf.title}
                    </span>
                    <span className="badge badge-amber text-[9px] font-mono">{conf.confidenceScore}% conf</span>
                  </div>
                  <p style={{ color: "var(--text-muted)" }}>{conf.description}</p>
                  <div className="text-[11px] font-mono pt-1 text-green-500">
                    Resolution: {conf.suggestedResolution}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-green-500 font-mono">
              ✓ Zero architectural contradictions detected across Tech Stack, Features, Database Collections, and System Architecture Diagram.
            </p>
          )}
        </div>
      )}

      {/* Quality Score Radial Badge */}
      <QualityScoreBadge score={blueprint.qualityScore} />

      {/* Tab Navigation */}
      <div className="tabs">
        {[
          { id: "overview" as const, label: "Blueprint Modules", icon: Layers },
          { id: "architecture" as const, label: "System Diagram", icon: Network },
          { id: "roadmap" as const, label: "Roadmap & Risks", icon: Calendar },
          { id: "export" as const, label: "Starter Kit Export", icon: FileCode2 },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`tab-btn ${activeTab === id ? "active" : ""}`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* TAB: MODULES OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {blueprint.sections.map((section) => (
            <BlueprintCard
              key={section.id}
              blueprintId={blueprint.id}
              section={section}
              onUpdateSection={handleUpdateSection}
            />
          ))}
        </div>
      )}

      {/* TAB: SYSTEM ARCHITECTURE DIAGRAM */}
      {activeTab === "architecture" && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4" style={{ color: "var(--accent)" }} />
              <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>System Architecture Blueprint</h3>
            </div>
            <span className="badge badge-amber text-[10px] font-mono">
              [Domain-Aware Mermaid]
            </span>
          </div>

          <MermaidDiagram chart={blueprint.mermaidDiagram} />

          <div className="card p-4 space-y-2 text-xs font-mono" style={{ background: "var(--bg)" }}>
            <div className="font-semibold text-amber-500">Tech Stack Architecture Specifications:</div>
            <ul className="space-y-1 text-muted">
              <li>• Frontend: {tech.techStack?.frontend || "Next.js 14 (App Router), TypeScript, Tailwind CSS"}</li>
              <li>• Backend API: {tech.techStack?.backend || "Next.js Server API Routes, Node.js"}</li>
              <li>• Database: {tech.techStack?.database || "Firebase Firestore"}</li>
              <li>• AI Inference Engine: {tech.techStack?.ai || "Gemini 1.5 Pro / OpenAI GPT-4o-mini"}</li>
            </ul>
          </div>
        </div>
      )}

      {/* TAB: ROADMAP & RISKS */}
      {activeTab === "roadmap" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card p-5 space-y-4">
            <div className="flex items-center gap-2 font-semibold text-sm border-b pb-2" style={{ borderColor: "var(--border)", color: "var(--text)" }}>
              <Calendar className="w-4 h-4 text-amber-500" />
              Development Phases
            </div>
            <div className="space-y-3">
              {(risks.developmentPhases || [
                { phase: "Phase 1", title: "Idea Blueprint & Architecture", effort: "4 hrs" },
                { phase: "Phase 2", title: "MVP Frontend & API Integration", effort: "8 hrs" },
                { phase: "Phase 3", title: "Launch Audit & Production Verification", effort: "4 hrs" },
              ]).map((p: any, idx: number) => (
                <div key={idx} className="card p-3 space-y-1 text-xs" style={{ background: "var(--bg)" }}>
                  <div className="flex items-center justify-between font-mono font-semibold" style={{ color: "var(--accent)" }}>
                    <span>{p.phase}: {p.title}</span>
                    <span className="badge badge-muted text-[10px]">{p.effort}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5 space-y-4">
            <div className="flex items-center gap-2 font-semibold text-sm border-b pb-2" style={{ borderColor: "var(--border)", color: "var(--text)" }}>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Risk Analysis &amp; Mitigation
            </div>
            <div className="space-y-3">
              {(tech.riskAnalysis || [
                { risk: "External API rate limiting", mitigation: "Caching and read-only auth tokens" },
                { risk: "LLM response latency", mitigation: "Structured fallback schemas with timeout bounds" },
              ]).map((r: any, idx: number) => (
                <div key={idx} className="card p-3 space-y-1 text-xs" style={{ background: "var(--bg)" }}>
                  <div className="font-semibold text-red-500">Risk: {r.risk}</div>
                  <div className="text-muted font-mono">Mitigation: {r.mitigation}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: EXPORT */}
      {activeTab === "export" && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-green-500" />
              <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>One-Click Starter Kit Package</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generateStarterKitBundle(blueprint));
                  alert("Starter Kit Bundle copied to clipboard!");
                }}
                className="btn btn-secondary btn-sm"
              >
                Copy Complete Kit
              </button>
              <button onClick={handleDownloadStarterKit} className="btn btn-primary btn-sm">
                <Download className="w-3.5 h-3.5" />
                Download (.md)
              </button>
            </div>
          </div>

          <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Generates structured project starter kit containing <code className="text-amber-500 font-mono">README.md</code>, <code className="text-amber-500 font-mono">PRD.md</code>, <code className="text-amber-500 font-mono">TRD.md</code>, <code className="text-amber-500 font-mono">LICENSE</code>, <code className="text-amber-500 font-mono">.env.example</code>, <code className="text-amber-500 font-mono">api-spec.json</code>, and <code className="text-amber-500 font-mono">schema.json</code>.
          </p>

          <pre className="code-block text-[11px] max-h-96 overflow-y-auto whitespace-pre-wrap font-mono p-4 rounded-xl">
            {generateStarterKitBundle(blueprint)}
          </pre>
        </div>
      )}
    </div>
  );
}
