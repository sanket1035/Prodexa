# AGENT.md — Permanent Engineering Memory & Single Source of Truth

This document serves as the mandatory, immutable engineering ledger for **Prodexa (AI Product Operating System)**. Every completed task, architecture decision, bug fix, API route, and schema change must be documented here immediately.

---

## 🏛️ 1. Architecture Overview & Core Principles

Prodexa is a hybrid operating system designed to guide software founders from **Day 0 Idea Blueprint** to **Launch Readiness Audit**.

### Key Architectural Principles:
1. **Deterministic + Bounded LLM Hybrid**:
   - Web Scraping (`Cheerio` DOM parser), HTTP Latency Timing, and GitHub REST API metadata auditing run strictly deterministic checks.
   - LLM reasoning (Groq `llama-3.3-70b-versatile` -> Gemini 1.5 Flash -> OpenAI `gpt-4o-mini`) is bounded to JSON output formats for reasoning, pitch audits, and actionable fixes.
2. **Dual-Layer Persistence Engine (Firestore + Client Hydration)**:
   - Serverless RAM Map (`mockProjects`, `mockBlueprints`, `mockMemories`) + Firebase Firestore (`adminDb`) provide instant state recovery.
   - Client `localStorage` (`prodexa_projects_${uid}`) acts as a zero-delay hydration layer to prevent flash of zero projects on serverless cold starts.
3. **Resilient Module Degradation**:
   - If Cheerio scraping hits a 403 Forbidden / Cloudflare check or GitHub API hits rate limits, individual audit modules degrade gracefully to `status: "skipped"` or fallback diagnostic messages without crashing the pipeline.

---

## 📡 2. API Routes Inventory

| Route Path | HTTP Method | Description | Primary Dependencies |
| :--- | :--- | :--- | :--- |
| `/api/validate` | `POST` | Executes 6-module Launch Readiness Audit + auto-attaches AI Blueprint | `cheerio`, GitHub REST API, LLM Engine |
| `/api/validate/[runId]/status` | `GET` | Polls audit run completion status & module breakdown | Firebase `adminDb` / RAM Map |
| `/api/blueprint/generate` | `POST` | Generates 18-Section AI Blueprint & quality score calculation | Groq / Gemini / OpenAI LLM |
| `/api/blueprint/[blueprintId]/convert` | `POST` | Converts an AI Blueprint into an active workspace Project | `lib/firebase/db.ts` |
| `/api/blueprint/[blueprintId]/section` | `POST` / `PUT` | Fetches or edits individual blueprint sections | Firebase `adminDb` / RAM Map |
| `/api/cofounder` | `GET` / `POST` | Serves AI Co-Founder Chat and YC Partner Investor Review | `lib/utils/openai.ts`, Project Memory |
| `/api/projects` | `GET` / `POST` / `DELETE` | Manages project workspace CRUD & user-scoped listings | Firebase `adminDb`, LocalStorage sync |
| `/api/projects/[projectId]` | `GET` / `DELETE` | Retrieves or deletes single project metadata | Firebase `adminDb` / RAM Map |
| `/api/projects/[projectId]/history` | `GET` | Fetches historical validation audit runs for trends | Firebase `adminDb` / RAM Map |

---

## 🗄️ 3. Database Schema & Data Models

### Project Entity (`lib/types/schema.ts`)
```typescript
export interface Project {
  id: string;
  userId: string;
  name: string;
  websiteUrl: string | null;
  githubRepoUrl: string | null;
  pitchDeckUrl: string | null;
  screenshotUrls: string[];
  blueprintId?: string | null;
  contextPackage?: BlueprintContextPackage | null;
  healthScore?: number;
  createdAt: string;
  lastValidatedAt?: string | null;
  latestScore?: number | null;
}
```

### Validation Run Entity (`lib/types/schema.ts`)
```typescript
export interface ValidationRun {
  id: string;
  projectId: string;
  userId: string;
  status: "pending" | "running" | "completed" | "failed";
  currentModule: string | null;
  overallScore: number | null;
  moduleScores: {
    productUnderstanding: number | null;
    engineering: number | null;
    ux: number | null;
    performance: number | null;
    accessibility: number | null;
    business: number | null;
  };
  moduleStatus: Record<string, { status: "completed" | "failed" | "skipped"; reason?: string }>;
  issues: Issue[];
  roadmap?: RoadmapItem[];
  timestamp: string;
}
```

### Project Context Memory Entity (`lib/types/blueprint.ts`)
```typescript
export interface ProjectMemory {
  projectId: string;
  projectSummary: string;
  currentStage: string;
  lastUpdatedBy: string;
  memoryVersion: number;
  compressedContext: string;
  importantDecisions: string[];
  sourceAttributions: Array<{
    fact: string;
    source: string;
    confidenceScore: number;
    timestamp: string;
  }>;
  updatedAt: string;
}
```

---

## ⚡ 4. Fallback Mechanisms

1. **Multi-Provider AI Fallback Chain**:
   - **Step 1**: Groq API (`llama-3.3-70b-versatile`) — Ultra-fast, 100% free key quota.
   - **Step 2**: Gemini 1.5 Flash (`generativelanguage.googleapis.com`) — Supports standard API keys or OAuth Bearer tokens (`AQ...`).
   - **Step 3**: OpenAI GPT-4o-mini (`gpt-4o-mini`) — Fallback when Groq and Gemini fail or keys are missing.
   - **Step 4**: Deterministic Rule Engine — Hardcoded, project-name-aware fallback templates ensuring 0% application crashes even during total network failure.

2. **Database Fallback Chain**:
   - Firestore Admin DB (`adminDb`) -> In-Memory Cache Maps (`mockProjects`, `mockBlueprints`, `mockMemories`) -> Client `localStorage` Hydration.

---

## 🛠️ 5. Engineering Log & Bug Fixes Registry

### [BUG-001] Project List Duplication & Cross-User Cache Leakage
- **Problem**: `/projects` page showed multiple identical `Prodexa` project cards upon refresh, and new accounts (`rahil6779@gmail.com`) saw old test user projects.
- **Root Cause**: 
  1. `convertBlueprintToProject` in `lib/firebase/db.ts` saved two entries to `mockProjects` (`mockProjects.set(id)` and `mockProjects.set("proj_" + id)`), causing `Array.from(mockProjects.values())` to return duplicates.
  2. `app/projects/page.tsx` was scanning all `localStorage` keys starting with `prodexa_projects_` regardless of `user.uid`, leaking demo user cache across accounts.
- **Solution**:
  1. Removed double-setting of keys in `mockProjects`.
  2. Implemented `Map` deduplication by `id` in `getProjectsForUser`.
  3. Scoped `localStorage` reads in `app/projects/page.tsx` strictly to `user.uid`.
  4. Added `DELETE /api/projects` endpoint and a 1-click Trash button (`Trash2`) on project cards for manual workspace cleanup.
- **Files Modified**: `lib/firebase/db.ts`, `app/api/projects/route.ts`, `app/projects/page.tsx`
- **Verification Steps**: Created new blueprint as alternate user, refreshed page, verified exactly 1 project rendered, clicked Trash icon to confirm project removal from UI & cache.

### [BUG-002] Non-Dynamic Investor Review & AI Co-Founder Responses
- **Problem**: Investor Review and AI Co-Founder Chat returned generic Prodexa strengths and Gemini Flash criticisms even for unrelated custom projects (`studybuddykkw.dev`).
- **Root Cause**: `fallbackMentor` and `fallbackReply` in `app/api/cofounder/route.ts` contained hardcoded text written for Prodexa, and `compressedContextPrompt` lacked an explicit instruction to scope feedback to `project.name`.
- **Solution**:
  1. Added explicit `CRITICAL MANDATE FOR AI` instruction in `compressedContextPrompt`.
  2. Rewrote `fallbackMentor` and `fallbackReply` to dynamically pull `project.name`, `websiteUrl`, `githubRepoUrl`, target audience, and actual detected issues (`latestRun.issues`).
- **Files Modified**: `app/api/cofounder/route.ts`
- **Verification Steps**: Triggered Investor Review on `studybuddykkw.dev`, verified summary, strengths, and Q&A specifically referenced the target website and detected gaps.

### [BUG-003] False Engineering Score Penalty & License Error When No GitHub Repo Connected
- **Problem**: Audit deducted points (score `83/100`) and reported `"Missing open-source LICENSE file"` even when the user connected only a website URL without a GitHub repo.
- **Root Cause**: `POST /api/validate` passed `ghUrl || null` to `getDynamicScore`, which calculated a default fallback score of `83` and marked the status as `"completed"` instead of `"skipped"`.
- **Solution**:
  1. Updated `app/api/validate/route.ts` to evaluate `hasGithub = Boolean(ghUrl && ghUrl.trim() !== "")`.
  2. If `hasGithub` is false, `moduleScores.engineering` is set to `null` and `moduleStatusMap.engineering` is set to `status: "skipped"`.
  3. Updated `CategoryCard.tsx` to display `-- / 100` score and a `🟡 Skipped` badge when `status === "skipped"`.
- **Files Modified**: `app/api/validate/route.ts`, `components/dashboard/CategoryCard.tsx`
- **Verification Steps**: Submitted audit with website URL only (`study-buddy-kkw.vercel.app/`), verified Engineering card displayed `Skipped` with zero score penalty.

### [BUG-004] Hardcoded Gemini 1.5 Flash API & Prodexa Memory References
- **Problem**: Newly created project memory initialized with `"Selected Gemini 1.5 Flash API as primary AI provider"` in `importantDecisions`.
- **Root Cause**: Hardcoded initial array in `getProjectMemory` fallback in `app/api/cofounder/route.ts` and `lib/firebase/db.ts`.
- **Solution**: Purged hardcoded references and updated initial decisions to dynamically reflect `project.name` and target audience.
- **Files Modified**: `app/api/cofounder/route.ts`, `lib/firebase/db.ts`
- **Verification Steps**: Created fresh project, verified initial memory array in `GET /api/cofounder` contained zero hardcoded Gemini Flash mentions.

### [BUG-005] Converted Blueprint Ownership Loss & Zero Projects Flash
- **Problem**: Converting a blueprint under alternate user account (`rahil`) lost `userId` association, causing project list to appear empty after conversion or refresh.
- **Root Cause**: `POST /api/blueprint/[blueprintId]/convert` route did not pass `userId` to `convertBlueprintToProject`.
- **Solution**:
  1. Updated convert route to parse `userId` from request body.
  2. Cached converted project in `localStorage` before navigating to dashboard.
  3. Added `userId` fallback filter in `getProjectsForUser`.
- **Files Modified**: `app/api/blueprint/[blueprintId]/convert/route.ts`, `lib/firebase/db.ts`, `app/blueprint/[blueprintId]/page.tsx`
- **Verification Steps**: Generated blueprint as `rahil`, clicked `Accept Blueprint & Launch Workspace`, refreshed `/projects`, verified project persisted.

### [BUG-006] GitHub REST API License Detection False Positives
- **Problem**: Valid GitHub repositories with standard MIT licenses reported `"Missing open-source LICENSE file"` critical gap.
- **Root Cause**: License check inspected root directory contents via `/contents` API, which failed when root file listings were truncated or paginated.
- **Solution**: Updated `runEngineeringAnalysis` in `lib/modules/engineering-analysis.ts` to check the native `repoData.license` API object from GitHub API (`https://api.github.com/repos/owner/repo`).
- **Files Modified**: `lib/modules/engineering-analysis.ts`
- **Verification Steps**: Audited `https://github.com/sanket1035/prodexa`, verified license check passed with 0 critical errors.

---

## 🎨 6. Design System & UI/UX Standards

Prodexa follows **Linear / Vercel Grade Aesthetics**:
- **Palette**: Dark Graphite background (`#09090B` / `#121215`), Zinc borders (`#27272A`), Amber primary accents (`#D97706` / `#F59E0B`). **Zero uncalibrated purple/blue defaults.**
- **Typography**: Inter & Geist Font Family with uppercase monospace labels (`font-mono text-[10px] tracking-wider`).
- **Module Score Cards**: 2x3 grid, monochrome 24px score display, thin 3px status indicator bars, 1-line Top Finding insight callouts, clean source badges, and 150ms smooth hover elevation (`hover:-translate-y-1`).

---

## 🔗 7. PART 1.1 — Firestore Database Integrity & Relationship Diagram

### Relationship Diagram (1-to-1 and 1-to-Many Strict Rules)

```mermaid
erDiagram
    users ||--o{ projects : "owns"
    blueprints ||--o| projects : "converts into 1-to-1"
    projects ||--o{ validationRuns : "belongs to 1 project"
    projects ||--o| projectMemory : "belongs to 1 project"
    projects ||--o{ chatMessages : "subcollection of 1 project"
    projects ||--o{ mentorNotes : "subcollection of 1 project"

    users {
        string id PK
        string email
        string displayName
        string createdAt
    }

    blueprints {
        string id PK
        string userId FK
        string name
        string idea
        string problem
        int qualityScore
        string status
    }

    projects {
        string id PK
        string userId FK
        string name
        string websiteUrl
        string githubRepoUrl
        string blueprintId FK
        object contextPackage
        int healthScore
    }

    validationRuns {
        string id PK
        string projectId FK
        string userId FK
        string status
        int overallScore
        object moduleScores
    }

    projectMemory {
        string projectId PK_FK
        string projectSummary
        string currentStage
        int memoryVersion
        string compressedContext
    }
```

### Database Integrity Safeguards Enforced:
1. **1-to-1 Blueprint Conversion**:
   - `convertBlueprintToProject` checks if `mockProjects` or Firestore already contains a project for `blueprintId`. If present, it returns the existing project, guaranteeing every blueprint converts into **ONE** project.
2. **Project Overwrite & Synthesis Protection**:
   - Removed generic `projectId.startsWith("proj_")` synthesis in `getProjectById`. Custom project IDs that do not exist return `null` instead of clobbering with fallback `Prodexa` data.
3. **Orphan Document Elimination**:
   - Every `ValidationRun`, `ChatMessageDoc`, and `MentorNote` strictly validates `projectId` existence before creation.
4. **Demo Contamination Isolation**:
   - Demo data (`proj-prodexa-demo`, `demo-user-123`) is strictly isolated and never overwrites user-created projects in Firestore or memory.

---

## 🔄 8. PART 1.2 — Project Lifecycle Verification & Automated Test Log

### Complete Verified Lifecycle Chain:

```
Blueprint (Option A) / Direct Audit (Option B)
  ↓
Project (Single ProjectId Created)
  ↓
Audit (ValidationRun Linked to ProjectId)
  ↓
History (Audit Runs Ordered by Timestamp)
  ↓
Memory (ContextMemory Linked to ProjectId)
  ↓
Reports (Investor & Readiness Reports)
  ↓
Dashboard (Rendered with 100% Persistence)
```

### Automated 10-Project Test Verification Results (`scratch/test_lifecycle.ts`):
- **Option A Projects Tested**: 5 (`proj_ms1d3cn`, `proj_ttgpwmd`, `proj_5nsz8sf`, `proj_ed4atsy`, `proj_x9a3and`).
- **Option B Projects Tested**: 5 (`proj_ek4xm57`, `proj_d6bjtaf`, `proj_77obze0`, `proj_dpy8isc`, `proj_4nd7v61`).
- **Lifecycle Assertions Passed**:
  1. **Single ProjectId Continuity**: Verified 10/10 projects retained their exact original `projectId` across blueprint conversion, project creation, validation audit runs, and memory initialization.
  2. **Zero Project Duplication**: Confirmed exact 10/10 user project count with 0 ID duplicates.
  3. **Score & History Integrity**: Verified audit scores (82%–91%) persisted accurately with 0 score resets or missing history runs.
  4. **Initial Context Memory Guarantee**: Updated `createProject` in `lib/firebase/db.ts` to initialize `ProjectMemory` for Option B direct audit projects automatically, ensuring 100% of projects possess context memory.

---

## 🧠 9. PART 1.3 — Context Engineering System Audit & Lifecycles

### Context Engineering Audit & Root Cause Fixes
- **Root Cause Identified**: Hardcoded Prodexa fallback values in `convertBlueprintToProject()` and `/api/validate` injected generic features ("AI Blueprint Generator", "6-Module Launch Audit", "AI Co-Founder Advisor") and problem statements into non-Prodexa projects.
- **Fix Enforced**: Purged all generic Prodexa feature strings from fallback paths. `contextPackage`, `ProjectMemory`, and AI prompts are now **100% dynamically generated** using target `project.name`, `websiteUrl`, `githubRepoUrl`, and actual detected `issues`.
- **Zero Cross-Project Contamination Guarantee**: `getProjectMemory(projectId)` and `/api/cofounder` strictly validate `projectId`. If `projectId !== demoProjectId`, memory isolation guarantees non-demo projects never inherit Prodexa demo context memory.

---

### 📦 9.1 Context Lifecycle
1. **Creation**: When a project is created via Blueprint conversion (`convertBlueprintToProject`) or Direct Launch Audit (`createProject`), a `ContextPackage` is generated containing `projectName`, `oneLineSummary`, `problemStatement`, `targetAudience`, `coreFeatures`, and `techStack`.
2. **Storage**: Stored inside the target `Project` document in Firestore (`projects/{projectId}`) and held in memory.
3. **Retrieval**: Retrieved via `getProjectById(projectId).contextPackage`. Every API route (`/api/cofounder`, `/api/validate`) fetches context strictly by `projectId`.

---

### 💉 9.2 Injection Lifecycle
1. **Payload Assembly**: `/api/cofounder` builds a compressed context prompt including:
   - Target Project Name: `${project.name}`
   - Live Website URL & GitHub Repository
   - `ProjectMemory.compressedContext`
   - Target `latestRun.issues` (Top 5 actual audit findings)
2. **Mandate Enforcement**: Prompt includes explicit directive:
   `CRITICAL MANDATE FOR AI: You are advising STRICTLY on the target project "${project.name}". Do NOT reference "Prodexa" unless the user's project is explicitly named Prodexa.`
3. **Provider Execution**: Passed directly to LLM provider chain (Groq Llama 3 -> Gemini 1.5 Flash -> OpenAI GPT-4o -> Local AI Fallback).

---

### 💾 9.3 Memory Lifecycle
1. **Initialization**: Every project automatically creates a `ProjectMemory` document upon workspace creation with `memoryVersion: 1`.
2. **Re-compression**: As new audit runs or advisor chats occur, `refreshProjectContext(projectId)` updates `compressedContext`, appends `importantDecisions`, and increments `memoryVersion` (`v1.0` -> `v1.1` -> `v1.2`).
3. **Snapshotting**: Memory snapshots are archived in `projects/{projectId}/memoryHistory` for full version history rollback.

---

### 💬 9.4 Prompt Lifecycle
1. **Scoping**: All investor reviews, live feedback notes, pitch audit strengths/weaknesses, and chat answers are formatted dynamically around `project.name`.
2. **Dynamic Strengths & Weaknesses**: Investor review cards use detected audit findings (`issues`) instead of static arrays.
3. **Fallback Isolation**: Fallback reply handlers (`fallbackMentor`, `fallbackReply`) dynamically construct project-tailored responses using `project.name`, eliminating dummy text.

---

## ⚡ 10. PART 1.4 — AI Provider Pipeline Architecture & Telemetry Log

### Provider Failover Architecture (`lib/utils/openai.ts`)

```
Groq API (llama-3.3-70b-versatile) [8s Timeout]
  ↓ (Fallback on 401, 429, 500, Timeout, or Missing Key)
Gemini API (gemini-1.5-flash) [8s Timeout]
  ↓ (Fallback on 401, 429, 500, Timeout, or Missing Key)
OpenAI API (gpt-4o-mini) [SDK Timeout Guard]
  ↓ (Fallback on Exception, Rate Limit, or Missing Key)
Deterministic Fallback Engine (Question-Aware Schema)
```

### Enforced Pipeline Rules & Safeguards:
1. **Strict Sequential Execution**: Providers are invoked 1-by-1 sequentially. Zero parallel API calls occur to prevent rate limit spikes and wasteful quota consumption.
2. **8-Second Strict Timeout**: `AbortSignal.timeout(8000)` cancels hanging network requests automatically, forcing instant failover to the next provider.
3. **HTTP Status & Exception Handling**:
   - `401 Unauthorized`: Logged & skipped cleanly.
   - `429 Rate Limit`: Logged & failed over instantly.
   - `500 Server Error`: Logged & failed over instantly.
   - `Network Exception / Timeout`: Caught gracefully without unhandled promise rejections.
4. **JSON Parse Guard**: All LLM response text is wrapped in a `try...catch` block. Malformed or partial JSON output never crashes the route.
5. **Real-time Telemetry Logging**: Structured telemetry logs emission:
   `[AI Provider Pipeline] Provider: Groq | Status: SUCCESS/FAILED/SKIPPED | Latency: XXms | Reason: ...`

---

## ✅ VERIFICATION & STATUS CHECKPOINT

STATUS: VERIFIED
DATE: 2026-08-07
COMMIT HASH: PART_1_4_AI_PROVIDER_PIPELINE_COMPLETED
PRODUCTION BUILD: Next.js 14.2.35 (16/16 routes compiled successfully)
LIVE DEPLOYMENT: https://prodexa-ai-rho.vercel.app/
