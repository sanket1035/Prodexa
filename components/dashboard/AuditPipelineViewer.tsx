"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  CheckCircle2,
  XCircle,
  SkipForward,
  Loader2,
  Clock,
  Terminal,
  Activity,
  Sparkles,
  Globe,
  GitBranch,
  Layout,
  Gauge,
  Briefcase,
  Rocket,
  ShieldCheck,
} from "lucide-react";
import { ValidationRun } from "@/lib/types/schema";

export interface AuditModuleStep {
  id: string;
  name: string;
  category: "product" | "engineering" | "ux" | "performance" | "business" | "planner";
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  activeDescription: string;
  completedDescription: string;
  estimatedDurationMs: number;
}

export const AUDIT_PIPELINE_STEPS: AuditModuleStep[] = [
  {
    id: "productUnderstanding",
    name: "Product Understanding",
    category: "product",
    icon: Globe,
    activeDescription: "Scraping landing page metadata, value proposition, and CTA hierarchy...",
    completedDescription: "Product positioning, SEO description, and title tags validated.",
    estimatedDurationMs: 900,
  },
  {
    id: "engineering",
    name: "Engineering Analysis",
    category: "engineering",
    icon: GitBranch,
    activeDescription: "Auditing repository structure, dependencies, README quality, and code health...",
    completedDescription: "Repository architecture and package manifest audited.",
    estimatedDurationMs: 800,
  },
  {
    id: "ux",
    name: "UX Validation",
    category: "ux",
    icon: Layout,
    activeDescription: "Checking mobile viewport heuristics, OpenGraph tags, and contrast accessibility...",
    completedDescription: "UX accessibility and social preview meta tags verified.",
    estimatedDurationMs: 850,
  },
  {
    id: "performance",
    name: "Performance Analysis",
    category: "performance",
    icon: Gauge,
    activeDescription: "Measuring network TTFB, page payload size, and Lighthouse bundle metrics...",
    completedDescription: "Network latency and asset size benchmarks recorded.",
    estimatedDurationMs: 750,
  },
  {
    id: "business",
    name: "Business Review",
    category: "business",
    icon: Briefcase,
    activeDescription: "Reviewing monetization signals, contact channels, and market positioning...",
    completedDescription: "Pricing model and business contact channels reviewed.",
    estimatedDurationMs: 800,
  },
  {
    id: "planner",
    name: "Launch Planner Engine",
    category: "planner",
    icon: Rocket,
    activeDescription: "Synthesizing readiness score, prioritizing gaps, and compiling action roadmap...",
    completedDescription: "Launch Readiness Score computed across all 6 audit modules.",
    estimatedDurationMs: 900,
  },
];

export interface LogEntry {
  timestamp: string;
  text: string;
  type: "info" | "active" | "success" | "skipped" | "error";
}

export interface AuditPipelineViewerProps {
  isExecuting: boolean;
  completedRun: ValidationRun | null;
  websiteUrl?: string | null;
  githubRepoUrl?: string | null;
  onFinish?: () => void;
}

export default function AuditPipelineViewer({
  isExecuting,
  completedRun,
  websiteUrl,
  githubRepoUrl,
  onFinish,
}: AuditPipelineViewerProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepStatuses, setStepStatuses] = useState<Record<string, "waiting" | "running" | "completed" | "skipped" | "failed">>({
    productUnderstanding: "waiting",
    engineering: "waiting",
    ux: "waiting",
    performance: "waiting",
    business: "waiting",
    planner: "waiting",
  });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(Date.now());

  const hasWebsite = Boolean(websiteUrl && websiteUrl.trim() !== "");
  const hasGithub = Boolean(githubRepoUrl && githubRepoUrl.trim() !== "");

  // Format timestamp helper (e.g. 00:02.45)
  const formatTimestamp = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60).toString().padStart(2, "0");
    const sec = (totalSec % 60).toString().padStart(2, "0");
    const tenths = Math.floor((ms % 1000) / 100).toString();
    return `${min}:${sec}.${tenths}`;
  };

  // Auto-scroll terminal to bottom when new logs arrive
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Main Sequential Pipeline Execution Effect
  useEffect(() => {
    if (!isExecuting) return;

    startTimeRef.current = Date.now();
    setCurrentStepIndex(0);
    setIsFinished(false);
    setElapsedMs(0);

    const initialLog: LogEntry = {
      timestamp: "00:00.0",
      text: "▶ [PIPELINE] Initializing Launch Audit Sequential Execution Engine...",
      type: "info",
    };
    setLogs([initialLog]);

    // Timer for elapsed time
    const timerInterval = setInterval(() => {
      setElapsedMs(Date.now() - startTimeRef.current);
    }, 100);

    let isSubscribed = true;

    const executeStepsSequentially = async () => {
      for (let i = 0; i < AUDIT_PIPELINE_STEPS.length; i++) {
        if (!isSubscribed) break;

        const step = AUDIT_PIPELINE_STEPS[i];
        const nowMs = Date.now() - startTimeRef.current;

        // Determine if step should be skipped based on URL assets
        let shouldSkip = false;
        if (step.id === "engineering" && !hasGithub) {
          shouldSkip = true;
        } else if (step.id !== "engineering" && step.id !== "planner" && !hasWebsite) {
          shouldSkip = true;
        }

        // Set current step to running
        setCurrentStepIndex(i);
        setStepStatuses((prev) => ({ ...prev, [step.id]: shouldSkip ? "skipped" : "running" }));

        // Append log
        const startLog: LogEntry = {
          timestamp: formatTimestamp(nowMs),
          text: shouldSkip
            ? `⏭ [MODULE ${i + 1}/6] ${step.name}: Skipped (${step.id === "engineering" ? "No GitHub URL connected" : "No Website URL connected"})`
            : `⚡ [MODULE ${i + 1}/6] ${step.name}: ${step.activeDescription}`,
          type: shouldSkip ? "skipped" : "active",
        };
        setLogs((prev) => [...prev, startLog]);

        if (shouldSkip) {
          await new Promise((res) => setTimeout(res, 300));
        } else {
          // Simulate active module execution duration
          await new Promise((res) => setTimeout(res, step.estimatedDurationMs));

          // Read real module status if completedRun is provided
          let realScore: number | null = null;
          if (completedRun?.moduleScores) {
            const mScores = completedRun.moduleScores as unknown as Record<string, number | null>;
            realScore = mScores[step.id] ?? null;
          }

          const endMs = Date.now() - startTimeRef.current;
          const endLog: LogEntry = {
            timestamp: formatTimestamp(endMs),
            text: `✓ [MODULE ${i + 1}/6] ${step.name} Completed. ${realScore !== null ? `Score: ${realScore}/100.` : ""} ${step.completedDescription}`,
            type: "success",
          };
          setLogs((prev) => [...prev, endLog]);
          setStepStatuses((prev) => ({ ...prev, [step.id]: "completed" }));
        }
      }

      if (!isSubscribed) return;

      // Final Completion Step
      const finalMs = Date.now() - startTimeRef.current;
      const scoreText = completedRun?.overallScore !== undefined && completedRun?.overallScore !== null
        ? ` Readiness Score: ${completedRun.overallScore}%`
        : "";

      const finalLog: LogEntry = {
        timestamp: formatTimestamp(finalMs),
        text: `🎉 [SUCCESS] Launch Audit Pipeline Completed Successfully.${scoreText}`,
        type: "success",
      };
      setLogs((prev) => [...prev, finalLog]);
      setIsFinished(true);

      // Brief 1-second pause before inviting full report reveal
      setTimeout(() => {
        if (isSubscribed && onFinish) {
          onFinish();
        }
      }, 1200);
    };

    executeStepsSequentially();

    return () => {
      isSubscribed = false;
      clearInterval(timerInterval);
    };
  }, [isExecuting, completedRun, hasWebsite, hasGithub]);

  const completedCount = Object.values(stepStatuses).filter((s) => s === "completed" || s === "skipped").length;
  const progressPercent = Math.min(100, Math.round((completedCount / 6) * 100));
  const estimatedRemainingSec = Math.max(0, Math.round((6 - completedCount) * 1.5));

  return (
    <div className="card p-6 md:p-7 space-y-6 max-w-4xl mx-auto w-full anim-fade" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      {/* Header Pipeline Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5" style={{ color: isFinished ? "var(--success)" : "var(--accent)" }} />
            <h2 className="text-base font-semibold tracking-tight" style={{ color: "var(--text)" }}>
              {isFinished ? "Launch Audit Completed Successfully" : "Launch Audit Sequential Execution Pipeline"}
            </h2>
          </div>
          <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
            Executing 6 deterministic readiness analysis modules
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className={`badge font-mono text-xs ${isFinished ? "badge-green" : "badge-amber"}`}>
            {isFinished ? (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Completed (6/6)
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 anim-spin" />
                Module {Math.min(6, currentStepIndex + 1)} of 6
              </span>
            )}
          </span>
          <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
            {isFinished ? `${(elapsedMs / 1000).toFixed(1)}s total` : `${estimatedRemainingSec}s remaining`}
          </span>
        </div>
      </div>

      {/* Global Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-mono" style={{ color: "var(--text-secondary)" }}>
          <span>Overall Pipeline Progress</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
          <div
            className="h-full transition-all duration-300 rounded-full"
            style={{
              width: `${progressPercent}%`,
              background: isFinished
                ? "linear-gradient(90deg, #22C55E 0%, #16A34A 100%)"
                : "linear-gradient(90deg, #D97706 0%, #F59E0B 100%)",
              boxShadow: isFinished ? "0 0 12px rgba(34,197,94,0.4)" : "0 0 12px rgba(217,119,6,0.4)",
            }}
          />
        </div>
      </div>

      {/* 6 Sequential Module Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {AUDIT_PIPELINE_STEPS.map((step, index) => {
          const status = stepStatuses[step.id] || "waiting";
          const isCurrent = currentStepIndex === index && !isFinished && status === "running";
          const isDone = status === "completed";
          const isSkipped = status === "skipped";
          const Icon = step.icon;

          return (
            <div
              key={step.id}
              className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                isCurrent
                  ? "border-amber-500/50 bg-amber-500/5 shadow-lg"
                  : isDone
                  ? "border-green-500/20 bg-green-500/5"
                  : isSkipped
                  ? "border-zinc-800 bg-zinc-900/30 opacity-60"
                  : "border-zinc-800/80 bg-zinc-900/20 opacity-50"
              }`}
            >
              {/* Icon Indicator */}
              <div className="mt-0.5 flex-shrink-0">
                {isDone ? (
                  <div className="w-6 h-6 rounded-lg bg-green-500/20 text-green-400 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                ) : isCurrent ? (
                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 anim-spin" />
                  </div>
                ) : isSkipped ? (
                  <div className="w-6 h-6 rounded-lg bg-zinc-800 text-zinc-400 flex items-center justify-center">
                    <SkipForward className="w-3.5 h-3.5" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-lg bg-zinc-900 text-zinc-600 flex items-center justify-center border border-zinc-800">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              {/* Module Text Details */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5" style={{ color: isCurrent ? "var(--accent)" : isDone ? "var(--success)" : "var(--text-muted)" }} />
                    <span className="text-xs font-semibold truncate" style={{ color: isCurrent ? "var(--text)" : isDone ? "var(--text)" : "var(--text-muted)" }}>
                      {step.name}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded" style={{
                    background: isDone ? "rgba(34,197,94,0.15)" : isCurrent ? "rgba(217,119,6,0.15)" : "rgba(255,255,255,0.05)",
                    color: isDone ? "var(--success)" : isCurrent ? "var(--accent)" : "var(--text-faint)",
                  }}>
                    {isDone ? "Completed" : isCurrent ? "Running" : isSkipped ? "Skipped" : "Waiting"}
                  </span>
                </div>

                <p className="text-[11px] leading-tight line-clamp-2" style={{ color: isCurrent ? "var(--text-secondary)" : "var(--text-muted)" }}>
                  {isCurrent ? step.activeDescription : isDone ? step.completedDescription : isSkipped ? "Module skipped for missing URL asset" : "Queued for audit pipeline"}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Real-Time Terminal Execution Log Panel (GitHub Actions / Vercel / Railway Style) */}
      <div className="rounded-xl border overflow-hidden" style={{ background: "#09090B", borderColor: "var(--border)" }}>
        {/* Terminal Header */}
        <div className="px-4 py-2.5 bg-zinc-900/80 border-b flex items-center justify-between text-xs font-mono text-zinc-400" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/80 inline-block" />
            </div>
            <span className="text-zinc-500 font-semibold ml-2 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-amber-500" />
              audit-runner.log
            </span>
          </div>
          <span className="text-[11px] text-zinc-500 font-mono">
            {logs.length} events logged
          </span>
        </div>

        {/* Terminal Body Log Lines */}
        <div className="p-4 font-mono text-xs space-y-1.5 max-h-48 overflow-y-auto" style={{ color: "#D4D4D8", background: "#09090B" }}>
          {logs.map((log, i) => (
            <div key={i} className="flex items-start gap-2 leading-relaxed">
              <span className="text-zinc-600 select-none font-mono text-[11px] flex-shrink-0">
                [{log.timestamp}]
              </span>
              <span className={`break-all ${
                log.type === "active"
                  ? "text-amber-400 font-semibold"
                  : log.type === "success"
                  ? "text-green-400"
                  : log.type === "skipped"
                  ? "text-zinc-500 italic"
                  : log.type === "error"
                  ? "text-red-400"
                  : "text-zinc-300"
              }`}>
                {log.text}
              </span>
            </div>
          ))}
          <div ref={terminalEndRef} />
        </div>
      </div>

      {/* Final Smooth Completion Callout */}
      {isFinished && (
        <div className="p-4 rounded-xl border border-green-500/30 bg-green-500/10 flex items-center justify-between anim-fade">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-green-300">
                Launch Audit Completed Successfully
              </div>
              <div className="text-xs text-green-400/80">
                Transitioning to full launch readiness report...
              </div>
            </div>
          </div>
          <button
            onClick={() => onFinish && onFinish()}
            className="btn btn-primary btn-sm bg-green-600 border-green-600 hover:bg-green-500"
          >
            View Readiness Report →
          </button>
        </div>
      )}
    </div>
  );
}
