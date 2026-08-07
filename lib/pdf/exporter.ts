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
