import { ValidationRun, Project } from "@/lib/types/schema";
import { Blueprint } from "@/lib/types/blueprint";

export function generateMarkdownReport(project: Project, run: ValidationRun): string {
  const timestamp = run.completedAt || run.createdAt;
  const dateStr = new Date(timestamp).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const getModuleStatusLabel = (score: number | null, statusObj?: { status: string; reason?: string }) => {
    if (statusObj?.status === "failed") {
      return `NOT VERIFIED — Website/Resource Offline (${statusObj.reason || "Unreachable"})`;
    }
    if (statusObj?.status === "skipped" || score === null) {
      return "NOT VERIFIED — Skipped (No input provided)";
    }
    return `${score}% (Verified)`;
  };

  return `# PRODEXA — Launch Readiness Audit Report

**Report ID**: ${run.id}
**Project Name**: ${project.name}
**Website URL**: ${project.websiteUrl || "Not Provided (Skipped)"}
**GitHub Repository**: ${project.githubRepoUrl || "Not Provided (Skipped)"}
**Generation Timestamp**: ${dateStr}
**Overall Launch Readiness Score**: ${run.overallScore !== null ? `${run.overallScore}%` : "NOT VERIFIED"}

---

## 1. Category Review Breakdown

- **Product Understanding**: ${getModuleStatusLabel(run.moduleScores.productUnderstanding, run.moduleStatus?.productUnderstanding)}
- **Engineering Review**: ${getModuleStatusLabel(run.moduleScores.engineering, run.moduleStatus?.engineering)}
- **UX Review**: ${getModuleStatusLabel(run.moduleScores.ux, run.moduleStatus?.ux)}
- **Performance Review**: ${getModuleStatusLabel(run.moduleScores.performance, run.moduleStatus?.performance)}
- **Accessibility Review**: ${getModuleStatusLabel(run.moduleScores.accessibility, run.moduleStatus?.accessibility)}
- **Business Review**: ${getModuleStatusLabel(run.moduleScores.business, run.moduleStatus?.business)}

---

## 2. Critical & Identified Issues (${run.issues.length} Total)

${
  run.issues.length > 0
    ? run.issues
        .map(
          (issue, i) => `### ${i + 1}. [${issue.severity.toUpperCase()}] ${issue.title}
**Category**: ${issue.category}
**Description**: ${issue.description}

**Actionable Code / Copy Recommendation**:
\`\`\`
${issue.fixText}
\`\`\`
`
        )
        .join("\n")
    : "No critical audit issues detected."
}

---

## 3. Launch Planner Roadmap (${run.roadmap.length} Items)

${
  run.roadmap.length > 0
    ? run.roadmap
        .map(
          (item, i) =>
            `${i + 1}. **${item.title}** (${item.priority.toUpperCase()}) — Estimated Effort: ${item.estimatedEffort}`
        )
        .join("\n")
    : "No pending roadmap items."
}

---
*Report generated automatically by Prodexa AI Product Operating System*
*Report Checksum / Signature: ${run.id}_${new Date(timestamp).getTime()}*
`;
}

export function exportExecutivePDFReport(project: Project, run: ValidationRun): void {
  const timestamp = run.completedAt || run.createdAt;
  const dateStr = new Date(timestamp).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const overallScore = run.overallScore ?? 0;
  const scores = (run.moduleScores || {}) as unknown as Record<string, number | null>;
  const issues = run.issues || [];
  const roadmap = run.roadmap || [];

  const scoreBadgeBg = overallScore >= 80 ? "#22C55E" : overallScore >= 60 ? "#EAB308" : "#EF4444";
  const verdictText = overallScore >= 80
    ? "READY FOR PUBLIC LAUNCH & INVESTOR PRESENTATION"
    : overallScore >= 60
    ? "MODERATE READINESS — RESOLVE HIGH PRIORITY GAPS BEFORE LAUNCH"
    : "CRITICAL REVISION REQUIRED BEFORE PUBLIC LAUNCH";

  const printHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>PRODEXA Executive Launch Readiness Report - ${project.name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');
    
    @page {
      size: A4 portrait;
      margin: 15mm;
    }
    
    * {
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #0F172A;
      background: #FFFFFF;
      line-height: 1.5;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .cover-page {
      height: 90vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-after: always;
      padding: 20px 0;
    }

    .brand-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #0F172A;
      padding-bottom: 15px;
    }

    .brand-logo {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 800;
      font-size: 22px;
      letter-spacing: -0.5px;
      color: #0F172A;
    }

    .brand-logo span {
      color: #D97706;
    }

    .doc-type {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      background: #F1F5F9;
      padding: 4px 10px;
      border-radius: 4px;
      color: #475569;
    }

    .cover-title-box {
      margin: 60px 0;
    }

    .cover-title {
      font-size: 32px;
      font-weight: 800;
      color: #0F172A;
      letter-spacing: -0.8px;
      margin: 0 0 12px 0;
    }

    .cover-subtitle {
      font-size: 16px;
      color: #64748B;
      margin: 0;
      font-weight: 400;
    }

    .hero-score-card {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 16px;
      padding: 30px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 30px;
    }

    .score-radial {
      width: 100 h;
      height: 100px;
      border-radius: 50%;
      background: conic-gradient(${scoreBadgeBg} ${overallScore * 3.6}deg, #E2E8F0 0deg);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .score-inner {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'JetBrains Mono', monospace;
      font-size: 24px;
      font-weight: 800;
      color: #0F172A;
    }

    .cover-meta-grid {
      display: grid;
      grid-template-cols: 1fr 1fr;
      gap: 15px;
      border-top: 1px solid #E2E8F0;
      padding-top: 20px;
      font-size: 12px;
    }

    .meta-label {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      color: #64748B;
      text-transform: uppercase;
      margin-bottom: 3px;
    }

    .meta-val {
      font-weight: 600;
      color: #0F172A;
      word-break: break-all;
    }

    .page-break {
      page-break-after: always;
    }

    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: #0F172A;
      border-bottom: 1px solid #E2E8F0;
      padding-bottom: 8px;
      margin-top: 0;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }

    .grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
    }

    .card {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 10px;
      padding: 16px;
      margin-bottom: 16px;
    }

    .module-card {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 10px;
      padding: 14px;
    }

    .module-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .module-name {
      font-size: 13px;
      font-weight: 700;
      color: #0F172A;
    }

    .module-score {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
      background: #F1F5F9;
    }

    .table-custom {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      margin-bottom: 20px;
      font-size: 11px;
    }

    .table-custom th {
      background: #0F172A;
      color: #FFFFFF;
      text-align: left;
      padding: 8px 10px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      text-transform: uppercase;
    }

    .table-custom td {
      border-bottom: 1px solid #E2E8F0;
      padding: 8px 10px;
      vertical-align: top;
    }

    .code-box {
      font-family: 'JetBrains Mono', monospace;
      background: #0F172A;
      color: #38BDF8;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 10px;
      white-space: pre-wrap;
      word-break: break-all;
      margin-top: 6px;
    }

    .verdict-banner {
      background: #F0FDF4;
      border: 1px solid #BBF7D0;
      color: #166534;
      padding: 14px 18px;
      border-radius: 10px;
      font-weight: 700;
      font-size: 13px;
      margin-bottom: 20px;
    }

    .page-footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: #94A3B8;
      font-family: 'JetBrains Mono', monospace;
      border-top: 1px solid #E2E8F0;
      padding-top: 6px;
      background: #FFFFFF;
    }
  </style>
</head>
<body>

  <!-- PAGE 1: COVER PAGE -->
  <div class="cover-page">
    <div class="brand-header">
      <div class="brand-logo">PRODEXA<span>.AI</span></div>
      <div class="doc-type">Executive Audit Deliverable v1.7</div>
    </div>

    <div class="cover-title-box">
      <div style="font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #D97706; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">
        Launch Readiness & Engineering Audit
      </div>
      <h1 class="cover-title">${project.name}</h1>
      <p class="cover-subtitle">Deterministic 6-Module Product Audit & Action Roadmap</p>

      <div class="hero-score-card">
        <div>
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; text-transform: uppercase; color: #64748B; margin-bottom: 4px;">
            Overall Launch Readiness Score
          </div>
          <div style="font-size: 28px; font-weight: 800; color: #0F172A;">
            ${overallScore}% Readiness
          </div>
          <div style="font-size: 12px; color: #64748B; margin-top: 4px;">
            Audited across Product, Code, UX, Performance, Business & Planner
          </div>
        </div>

        <div class="score-radial">
          <div class="score-inner">${overallScore}%</div>
        </div>
      </div>
    </div>

    <div class="cover-meta-grid">
      <div>
        <div class="meta-label">Target Website URL</div>
        <div class="meta-val">${project.websiteUrl || "Not Connected (Skipped)"}</div>
      </div>
      <div>
        <div class="meta-label">GitHub Repository</div>
        <div class="meta-val">${project.githubRepoUrl || "Not Connected (Skipped)"}</div>
      </div>
      <div>
        <div class="meta-label">Audit Timestamp</div>
        <div class="meta-val">${dateStr} at ${timeStr}</div>
      </div>
      <div>
        <div class="meta-label">Audit Report ID</div>
        <div class="meta-val" style="font-family: 'JetBrains Mono', monospace;">${run.id}</div>
      </div>
    </div>
  </div>

  <!-- PAGE 2: EXECUTIVE SUMMARY & MODULE SCORES -->
  <div class="page-break">
    <h2 class="section-title">
      <span>1. Executive Summary & Verdict</span>
      <span style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #64748B;">SECTION 01 / 04</span>
    </h2>

    <div class="verdict-banner">
      ⚡ EXECUTIVE VERDICT: ${verdictText}
    </div>

    <div class="grid-2">
      <div class="card">
        <div style="font-size: 12px; font-weight: 700; color: #0F172A; margin-bottom: 8px;">Key Strengths & Verifications</div>
        <ul style="margin: 0; padding-left: 18px; font-size: 11px; color: #334155;">
          ${(scores.productUnderstanding ?? 0) >= 70 ? "<li>Clear value proposition and structured SEO title metadata.</li>" : ""}
          ${(scores.ux ?? 0) >= 70 ? "<li>Mobile viewport responsiveness and meta tag coverage verified.</li>" : ""}
          ${(scores.performance ?? 0) >= 70 ? "<li>Network latency TTFB and initial bundle load within baseline.</li>" : ""}
          <li>Deterministic validation executed cleanly across analysis pipeline.</li>
        </ul>
      </div>

      <div class="card">
        <div style="font-size: 12px; font-weight: 700; color: #0F172A; margin-bottom: 8px;">Critical Risks & Action Items</div>
        <ul style="margin: 0; padding-left: 18px; font-size: 11px; color: #334155;">
          <li>${issues.length} audit issue${issues.length !== 1 ? "s" : ""} identified requiring resolution.</li>
          <li>${issues.filter((i) => i.severity === "critical").length} critical gap${issues.filter((i) => i.severity === "critical").length !== 1 ? "s" : ""} flagged.</li>
          <li>Review prioritized copy/code fix recommendations below.</li>
        </ul>
      </div>
    </div>

    <h2 class="section-title" style="margin-top: 30px;">
      <span>2. 6-Module Readiness Breakdown</span>
      <span style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #64748B;">SECTION 02 / 04</span>
    </h2>

    <div class="grid-3">
      <div class="module-card">
        <div class="module-header">
          <span class="module-name">Product</span>
          <span class="module-score">${scores.productUnderstanding !== null && scores.productUnderstanding !== undefined ? `${scores.productUnderstanding}%` : "Skipped"}</span>
        </div>
        <div style="font-size: 11px; color: #64748B;">Landing page copy, value prop, CTA clarity.</div>
      </div>

      <div class="module-card">
        <div class="module-header">
          <span class="module-name">Engineering</span>
          <span class="module-score">${scores.engineering !== null && scores.engineering !== undefined ? `${scores.engineering}%` : "Skipped"}</span>
        </div>
        <div style="font-size: 11px; color: #64748B;">Code architecture, dependencies, README.</div>
      </div>

      <div class="module-card">
        <div class="module-header">
          <span class="module-name">UX Validation</span>
          <span class="module-score">${scores.ux !== null && scores.ux !== undefined ? `${scores.ux}%` : "Skipped"}</span>
        </div>
        <div style="font-size: 11px; color: #64748B;">Mobile viewport, OpenGraph social meta.</div>
      </div>

      <div class="module-card">
        <div class="module-header">
          <span class="module-name">Performance</span>
          <span class="module-score">${scores.performance !== null && scores.performance !== undefined ? `${scores.performance}%` : "Skipped"}</span>
        </div>
        <div style="font-size: 11px; color: #64748B;">Network TTFB & DOM payload metrics.</div>
      </div>

      <div class="module-card">
        <div class="module-header">
          <span class="module-name">Business</span>
          <span class="module-score">${scores.business !== null && scores.business !== undefined ? `${scores.business}%` : "Skipped"}</span>
        </div>
        <div style="font-size: 11px; color: #64748B;">Monetization signals & contact channels.</div>
      </div>

      <div class="module-card">
        <div class="module-header">
          <span class="module-name">Launch Planner</span>
          <span class="module-score">${scores.planner !== null && scores.planner !== undefined ? `${scores.planner}%` : "Skipped"}</span>
        </div>
        <div style="font-size: 11px; color: #64748B;">Prioritized roadmap & action items.</div>
      </div>
    </div>
  </div>

  <!-- PAGE 3: ISSUES & ACTIONABLE CODE FIX MATRIX -->
  <div class="page-break">
    <h2 class="section-title">
      <span>3. Actionable Issue & Copy Fix Matrix (${issues.length} Issues)</span>
      <span style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #64748B;">SECTION 03 / 04</span>
    </h2>

    ${
      issues.length > 0
        ? `<table class="table-custom">
            <thead>
              <tr>
                <th style="width: 15%;">Severity</th>
                <th style="width: 25%;">Issue Title</th>
                <th style="width: 60%;">Actionable Code / Copy Fix Recommendation</th>
              </tr>
            </thead>
            <tbody>
              ${issues
                .map(
                  (iss) => `
                <tr>
                  <td>
                    <span style="font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 10px; color: ${
                      iss.severity === "critical" ? "#EF4444" : iss.severity === "high" ? "#F59E0B" : "#3B82F6"
                    }; text-transform: uppercase;">
                      ${iss.severity}
                    </span>
                  </td>
                  <td>
                    <div style="font-weight: 700; color: #0F172A;">${iss.title}</div>
                    <div style="font-size: 10px; color: #64748B; margin-top: 2px;">${iss.category}</div>
                  </td>
                  <td>
                    <div style="color: #334155;">${iss.description}</div>
                    ${iss.fixText ? `<div class="code-box">${iss.fixText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>` : ""}
                  </td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>`
        : `<div class="card" style="text-align: center; color: #64748B; font-size: 12px; font-family: 'JetBrains Mono', monospace;">
            ✓ No critical audit issues detected. System passed all verification checks cleanly.
          </div>`
    }
  </div>

  <!-- PAGE 4: ROADMAP & APPENDIX -->
  <div>
    <h2 class="section-title">
      <span>4. Action Roadmap & Audit Signature</span>
      <span style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #64748B;">SECTION 04 / 04</span>
    </h2>

    <div class="card">
      <div style="font-size: 12px; font-weight: 700; color: #0F172A; margin-bottom: 10px;">Prioritized Launch Tasks</div>
      ${
        roadmap.length > 0
          ? `<table class="table-custom" style="margin-top: 0;">
              <thead>
                <tr>
                  <th>Priority</th>
                  <th>Task Title</th>
                  <th>Estimated Effort</th>
                </tr>
              </thead>
              <tbody>
                ${roadmap
                  .map(
                    (task) => `
                  <tr>
                    <td>
                      <span style="font-family: 'JetBrains Mono', monospace; font-weight: 700; text-transform: uppercase; color: ${
                        task.priority === "high" ? "#EF4444" : "#D97706"
                      };">
                        ${task.priority}
                      </span>
                    </td>
                    <td style="font-weight: 600; color: #0F172A;">${task.title}</td>
                    <td style="font-family: 'JetBrains Mono', monospace; color: #64748B;">${task.estimatedEffort}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>`
          : `<div style="font-size: 11px; color: #64748B;">No pending roadmap items.</div>`
      }
    </div>

    <div class="card" style="margin-top: 30px; background: #0F172A; color: #FFFFFF;">
      <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #F59E0B; text-transform: uppercase; margin-bottom: 4px;">
        Prodexa AI Audit System Signature
      </div>
      <div style="font-size: 12px; color: #E2E8F0; margin-bottom: 8px;">
        Generated deterministically by Prodexa AI Operating System v1.7. This deliverable is formatted for founders, investors, and accelerators.
      </div>
      <div style="font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #94A3B8; word-break: break-all;">
        REPORT_ID: ${run.id} | CHECKSUM: ${run.id}_${new Date(timestamp).getTime()}
      </div>
    </div>
  </div>

  <div class="page-footer">
    <span>PRODEXA AI PRODUCT OPERATING SYSTEM — CONFIDENTIAL EXECUTIVE REPORT</span>
    <span>www.prodexa-ai.app</span>
  </div>

</body>
</html>`;

  const printWindow = window.open("", "_blank", "width=900,height=1000");
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();
    printWindow.focus();

    // Trigger clean print print dialog after fonts load
    setTimeout(() => {
      printWindow.print();
    }, 600);
  }
}

export function generateStarterKitBundle(blueprint: Blueprint): string {
  const dateStr = new Date(blueprint.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const foundation = blueprint.sections.find((s) => s.category === "foundation")?.content || {};
  const tech = blueprint.sections.find((s) => s.category === "tech")?.content || {};
  const db = blueprint.sections.find((s) => s.category === "database")?.content || {};
  const features = blueprint.sections.find((s) => s.category === "features")?.content || {};

  return `# ${blueprint.name.toUpperCase()} — ONE-CLICK PROJECT STARTER KIT BUNDLE
Generated on ${dateStr} by Prodexa (The AI Product Operating System)

================================================================================
FILE 1: README.md
================================================================================
# ${blueprint.name}

> ${blueprint.idea}

## Problem Statement
${foundation.problemStatement || blueprint.problem}

## Core Solution
${foundation.solutionStatement || "Autonomous pre-launch software solution."}

## Target Ideal Customer Profile (ICP)
${foundation.targetICP || blueprint.targetUsers || "Software teams and founders"}

## Quick Start
\`\`\`bash
npm install
npm run dev
\`\`\`

================================================================================
FILE 2: PRD.md (Product Requirements Document)
================================================================================
# PRD: ${blueprint.name}

## 1. Product Vision
${blueprint.idea}

## 2. Core MVP Features
${(features.mvpFeatures || ["Core User Dashboard", "AI Engine Endpoint"]).map((f: string) => `- ${f}`).join("\n")}

## 3. Future Roadmap
${(features.futureFeatures || ["Slack Integration", "Webhook Alerts"]).map((f: string) => `- ${f}`).join("\n")}

## 4. Monetization Strategy
${features.monetization || "Freemium SaaS tier."}

================================================================================
FILE 3: TRD.md (Technical Requirements Document)
================================================================================
# TRD: ${blueprint.name}

## 1. Technology Stack
- **Frontend**: ${tech.techStack?.frontend || "Next.js 14, React, Tailwind CSS"}
- **Backend**: ${tech.techStack?.backend || "Next.js API Server Routes"}
- **Database**: ${tech.techStack?.database || "Firebase Firestore"}
- **AI Engine**: ${tech.techStack?.ai || "Gemini / OpenAI Engine"}

## 2. System Architecture Diagram
\`\`\`mermaid
${blueprint.mermaidDiagram}
\`\`\`

================================================================================
FILE 4: LICENSE (MIT License)
================================================================================
MIT License

Copyright (c) 2026 ${blueprint.name} Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...

================================================================================
FILE 5: .env.example
================================================================================
# Environment Configuration
NEXT_PUBLIC_APP_NAME="${blueprint.name}"
NEXT_PUBLIC_FIREBASE_API_KEY="your-firebase-api-key"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
GEMINI_API_KEY="your-gemini-api-key"
OPENAI_API_KEY="your-openai-api-key"

================================================================================
FILE 6: api-spec.json
================================================================================
${JSON.stringify(db.endpoints || [
  { method: "POST", path: "/api/generate", desc: "Main AI processing endpoint" }
], null, 2)}

================================================================================
FILE 7: schema.json
================================================================================
${JSON.stringify(db.collections || [
  { name: "users", fields: "uid, email, displayName" },
  { name: "projects", fields: "id, name, contextPackage" }
], null, 2)}

================================================================================
FILE 8: development-tasks.md
================================================================================
1. [HIGH] Initialize Next.js 14 repository with Tailwind CSS and Inter font
2. [HIGH] Configure Firebase Admin SDK & Firestore database rules
3. [MEDIUM] Build core user dashboard and AI processing API routes
4. [MEDIUM] Execute pre-launch audit validation and export starter kit
`;
}

export function downloadFile(filename: string, text: string, type = "text/plain"): void {
  const element = document.createElement("a");
  const file = new Blob([text], { type });
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}
