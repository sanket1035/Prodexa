import { Project, ValidationRun } from "@/lib/types/schema";
import { Blueprint, BlueprintSection, ProjectMemory, ProjectMemorySnapshot, ChatMessageDoc, MentorNote } from "@/lib/types/blueprint";

// In-memory store fallbacks for zero-config local dev & demo safety
const mockProjects: Map<string, Project> = new Map();
const mockRuns: Map<string, ValidationRun> = new Map();
const mockBlueprints: Map<string, Blueprint> = new Map();
const mockMemories: Map<string, ProjectMemory> = new Map();
const mockMemorySnapshots: Map<string, ProjectMemorySnapshot[]> = new Map();
const mockChatDocs: Map<string, ChatMessageDoc[]> = new Map();
const mockNotes: Map<string, MentorNote[]> = new Map();

// Seed initial demo data for instant dashboard preview
const demoUserId = "demo-user-123";
const demoProjectId = "proj-prodexa-demo";
const demoRunId = "run-prodexa-1";
const demoBlueprintId = "bp-prodexa-demo";

const demoBlueprint: Blueprint = {
  id: demoBlueprintId,
  userId: demoUserId,
  name: "Prodexa — AI Product Operating System",
  idea: "An end-to-end platform that guides founders from Day 0 Idea to Launch Readiness using deterministic tooling and AI context memory.",
  problem: "Early stage builders launch without structured expert feedback on engineering, UX, performance, positioning, and market viability.",
  targetUsers: "Early-stage founders, hackathon teams, indie hackers, accelerator cohort directors.",
  qualityScore: {
    overall: 88,
    metrics: {
      innovation: 90,
      businessPotential: 86,
      technicalFeasibility: 92,
      scalability: 88,
      aiNecessity: 85,
      marketReadiness: 87,
    },
    strengths: [
      "Bridges the critical gap between Day 0 idea creation and Day 30 launch audit",
      "Combines real deterministic checks (Lighthouse, GitHub) with structured AI reasoning",
      "Stores bounded context memory packages to eliminate prompt re-querying",
    ],
    weaknesses: [
      "Requires explicit GitHub REST API access for deep engineering metadata audits",
      "Dependent on structured LLM JSON response formatting stability",
    ],
    rationale: "Prodexa scores 88/100 due to its strong technical feasibility, immediate hackathon demo utility, clear monetization path, and unique positioning before development starts.",
  },
  mermaidDiagram: `graph TD
    Client["Next.js 14 Frontend"] --> API["Next.js Server API Routes"]
    API --> Engine["6 Blueprint & Readiness Engine Modules"]
    API --> DB["Firebase Firestore & Context Memory"]
    Engine --> Scraper["Cheerio Scraper & GitHub API"]
    Engine --> OpenAI["OpenAI GPT-4o-mini / Gemini 1.5"]`,
  sections: [
    {
      id: "sec-1",
      title: "Product Foundation",
      category: "foundation",
      status: "accepted",
      content: {
        problemStatement: "Early-stage builders pitch or launch products with unvetted gaps—missing open-source licenses, broken heading hierarchies, sub-optimal mobile viewports, or missing contact channels.",
        solutionStatement: "Prodexa is an Autonomous AI Product Operating System that guides founders from Day 0 Idea Blueprint to Launch Readiness.",
        targetICP: "Early-stage software founders, hackathon teams, and incubator managers.",
      },
    },
    {
      id: "sec-2",
      title: "Market & Competitors",
      category: "market",
      status: "accepted",
      content: {
        competitors: [
          { name: "Generic AI Chatbots (ChatGPT / Claude)", strength: "Conversational speed", weakness: "Unstructured, zero database persistence, no deterministic code checks" },
          { name: "Linear / Notion", strength: "Project management", weakness: "Manual documentation creation, no AI readiness analysis" }
        ],
        marketGaps: "No tool connects Day 0 idea planning directly with pre-launch deterministic auditing.",
        investorNotes: "Large TAM in indie hacker tools, hackathon platforms, and pre-seed startup incubators.",
      },
    },
    {
      id: "sec-3",
      title: "Feature Architecture",
      category: "features",
      status: "accepted",
      content: {
        mvpFeatures: [
          "Dual-Entry Landing Page (Idea OS vs Launch Readiness)",
          "18-Section AI Blueprint Engine with Quality Score & Mermaid Diagram",
          "One-Click Project Starter Kit Downloader (PRD, TRD, DB Schema, API Specs)",
          "6 Deterministic Launch Readiness Analysis Modules with Copy-Fix Drawer"
        ],
        futureFeatures: ["GitHub OAuth PR creation", "Slack/Discord webhook notifications"],
        monetization: "Free for open-source & hackathons; $19/mo Pro tier for continuous monitoring."
      },
    },
    {
      id: "sec-4",
      title: "Tech & System Design",
      category: "tech",
      status: "accepted",
      content: {
        techStack: {
          frontend: "Next.js 14 (App Router), React, TypeScript, Tailwind CSS",
          backend: "Next.js Server API Routes, Firebase Admin SDK",
          database: "Firebase Firestore with Memory Fallback Store",
          ai: "Gemini 1.5 Flash Primary / GPT-4o-mini Fallback"
        },
        riskAnalysis: [
          { risk: "Target landing page blocks web scraping", mitigation: "Graceful degradation to 'Unable to analyze' status without pipeline failure" },
          { risk: "API rate limiting on GitHub", mitigation: "Read-only PAT authorization header for 5,000 req/hr tier" }
        ]
      },
    },
    {
      id: "sec-5",
      title: "Database & API Contract",
      category: "database",
      status: "accepted",
      content: {
        collections: [
          { name: "blueprints", fields: "id, userId, name, qualityScore, mermaidDiagram, contextPackage" },
          { name: "projects", fields: "id, userId, name, websiteUrl, githubRepoUrl, blueprintId, healthScore" },
          { name: "projectMemory", fields: "projectId, projectSummary, currentStage, memoryVersion, compressedContext" },
          { name: "validationRuns", fields: "id, projectId, status, overallScore, moduleScores, issues" }
        ],
        endpoints: [
          { method: "POST", path: "/api/blueprint/generate", desc: "Generates 6-module blueprint and quality score" },
          { method: "POST", path: "/api/blueprint/[id]/convert", desc: "Converts blueprint to project & starter kit" },
          { method: "POST", path: "/api/validate", desc: "Executes 6 launch readiness audit modules" }
        ]
      },
    },
    {
      id: "sec-6",
      title: "Folder & Development Plan",
      category: "risks",
      status: "accepted",
      content: {
        folderTree: `prodexa/\n├── app/ (Pages & API routes)\n├── components/ (Dashboard & Blueprint UI)\n├── lib/ (Modules, Scraping, Firebase, Exporters)\n└── firestore.rules`,
        developmentPhases: [
          { phase: "Phase 1", title: "Idea Blueprint Engine & Quality Score", effort: "4 hrs" },
          { phase: "Phase 2", title: "Mermaid Visualizer & Starter Kit Exporter", effort: "3 hrs" },
          { phase: "Phase 3", title: "Launch Readiness Integration & Context Reuse", effort: "3 hrs" }
        ]
      },
    }
  ],
  contextPackage: {
    blueprintId: demoBlueprintId,
    projectName: "Prodexa — AI Product Operating System",
    oneLineSummary: "An end-to-end platform that guides founders from Day 0 Idea to Launch Readiness.",
    problemStatement: "Early-stage builders launch without structured expert feedback on engineering, UX, performance, and business viability.",
    targetAudience: "Early-stage founders, hackathon teams, indie hackers, accelerator cohort directors.",
    coreFeatures: [
      "AI Blueprint Engine",
      "Mermaid System Architecture",
      "One-Click Project Starter Kit",
      "6 Deterministic Launch Readiness Modules"
    ],
    techStack: {
      frontend: "Next.js 14, Tailwind CSS",
      backend: "Next.js Server API Routes",
      database: "Firebase Firestore",
      ai: "Gemini 1.5 Flash Primary / GPT-4o-mini Fallback"
    },
    keyCompetitors: ["Generic AI Chatbots", "Linear / Notion"],
    generatedAt: new Date().toISOString(),
  },
  status: "accepted",
  createdAt: new Date().toISOString(),
};

const demoProject: Project = {
  id: demoProjectId,
  userId: demoUserId,
  name: "Prodexa Readiness Platform",
  websiteUrl: "https://github.com/sanket1035/prodexa",
  githubRepoUrl: "https://github.com/sanket1035/prodexa",
  pitchDeckUrl: null,
  screenshotUrls: [],
  blueprintId: demoBlueprintId,
  contextPackage: demoBlueprint.contextPackage,
  healthScore: 100,
  createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  lastValidatedAt: new Date().toISOString(),
  latestScore: 84,
};

const demoMemory: ProjectMemory = {
  projectId: demoProjectId,
  projectSummary: "Prodexa is an Autonomous AI Product Operating System that takes founders from Day 0 Idea Blueprint to Launch Readiness.",
  currentStage: "InvestorReady",
  lastUpdatedBy: "AI",
  memoryVersion: 3,
  compressedContext: "Prodexa targets early-stage software founders. Core tech stack is Next.js 14, Firebase Firestore, Tailwind CSS, and Gemini 1.5 Flash API. Identified gaps include hero CTA contrast and MIT license additions.",
  importantDecisions: [
    "Switched primary AI engine to Gemini 1.5 Flash with OpenAI fallback",
    "Added Investor & Judge Review pitch audit module",
    "Positioned as AI Product Operating System (Idea -> Build -> Launch)",
  ],
  sourceAttributions: [
    { fact: "Idea Blueprint generated 18-section architecture document", source: "BLUEPRINT_ENGINE", confidenceScore: 0.98, timestamp: new Date().toISOString() },
    { fact: "GitHub repository audit identified missing open-source LICENSE", source: "GITHUB_AUDIT", confidenceScore: 0.95, timestamp: new Date().toISOString() },
    { fact: "Investor Review recommended focusing pitch on Day 0 value creation", source: "MENTOR_NOTE", confidenceScore: 0.92, timestamp: new Date().toISOString() },
  ],
  updatedAt: new Date().toISOString(),
};

const demoRun: ValidationRun = {
  id: demoRunId,
  projectId: demoProjectId,
  userId: demoUserId,
  status: "completed",
  currentModule: null,
  overallScore: 84,
  moduleScores: {
    productUnderstanding: 88,
    engineering: 82,
    ux: 85,
    performance: 90,
    accessibility: 78,
    business: 82,
  },
  moduleStatus: {
    productUnderstanding: { status: "completed" },
    engineering: { status: "completed" },
    ux: { status: "completed" },
    performance: { status: "completed" },
    accessibility: { status: "completed" },
    business: { status: "completed" },
  },
  issues: [
    {
      id: "issue-1",
      category: "engineering",
      severity: "critical",
      title: "Missing open-source LICENSE file",
      description: "No LICENSE or COPYING file was detected in repository root. Potential adopters cannot legally use or audit your project.",
      fixText: `MIT License\n\nCopyright (c) 2026 Prodexa Team\n\nPermission is hereby granted, free of charge, to any person obtaining a copy...`,
    },
    {
      id: "issue-2",
      category: "ux",
      severity: "high",
      title: "Primary Hero CTA lacks explicit contrast & target area",
      description: "Hero call-to-action button uses 3.2:1 contrast ratio against dark background. Target WCAG AA minimum of 4.5:1.",
      fixText: `<button className="bg-[#D97B3F] hover:bg-[#E88A4E] text-[#0B0C0E] font-medium px-5 py-2.5 rounded-[6px] focus-visible:outline-2 focus-visible:outline-[#D97B3F]">\n  Validate Product\n</button>`,
    },
  ],
  roadmap: [
    { priority: "critical", title: "Add MIT License to repository root", estimatedEffort: "5 min" },
    { priority: "high", title: "Fix primary Hero CTA contrast to meet WCAG AA", estimatedEffort: "15 min" },
  ],
  createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  completedAt: new Date().toISOString(),
};

mockProjects.set(demoProjectId, demoProject);
mockRuns.set(demoRunId, demoRun);
mockBlueprints.set(demoBlueprintId, demoBlueprint);
mockMemories.set(demoProjectId, demoMemory);

// --- Memory History Snapshots & Source Attribution Methods ---

export async function saveProjectMemory(memory: ProjectMemory): Promise<ProjectMemory> {
  const updatedMemory = { ...memory, updatedAt: new Date().toISOString() };
  try {
    const { adminDb } = await import("./admin");
    await adminDb.collection("projectMemory").doc(memory.projectId).set(updatedMemory, { merge: true });

    // Save Memory History Version Snapshot
    const versionId = `v${memory.memoryVersion}_${Date.now()}`;
    const snapshot: ProjectMemorySnapshot = {
      version: memory.memoryVersion,
      compressedContext: memory.compressedContext,
      importantDecisions: memory.importantDecisions,
      updatedAt: updatedMemory.updatedAt,
    };
    await adminDb.collection("projectMemory").doc(memory.projectId).collection("history").doc(versionId).set(snapshot);
  } catch {
    // Memory fallback
  }

  mockMemories.set(memory.projectId, updatedMemory);
  const existingSnapshots = mockMemorySnapshots.get(memory.projectId) || [];
  mockMemorySnapshots.set(memory.projectId, [...existingSnapshots, {
    version: memory.memoryVersion,
    compressedContext: memory.compressedContext,
    importantDecisions: memory.importantDecisions,
    updatedAt: updatedMemory.updatedAt,
  }]);

  return updatedMemory;
}

export async function getProjectMemory(projectId: string): Promise<ProjectMemory | null> {
  try {
    const { adminDb } = await import("./admin");
    const doc = await adminDb.collection("projectMemory").doc(projectId).get();
    if (doc.exists) {
      return doc.data() as ProjectMemory;
    }
  } catch {
    // Fallback
  }
  return mockMemories.get(projectId) || null;
}

export async function getMemoryHistorySnapshots(projectId: string): Promise<ProjectMemorySnapshot[]> {
  try {
    const { adminDb } = await import("./admin");
    const snapshot = await adminDb
      .collection("projectMemory")
      .doc(projectId)
      .collection("history")
      .orderBy("version", "desc")
      .get();
    
    if (!snapshot.empty) {
      return snapshot.docs.map((doc) => doc.data() as ProjectMemorySnapshot);
    }
  } catch {
    // Fallback
  }
  return mockMemorySnapshots.get(projectId) || [];
}

/**
 * Background Context Refresh Service: Asynchronously re-compresses project context memory after major events
 */
export async function refreshProjectContext(projectId: string): Promise<ProjectMemory | null> {
  const memory = await getProjectMemory(projectId);
  if (!memory) return null;

  const notes = await getMentorNotes(projectId);
  const updatedMemory: ProjectMemory = {
    ...memory,
    memoryVersion: memory.memoryVersion + 1,
    sourceAttributions: [
      ...(memory.sourceAttributions || []),
      {
        fact: `Background Context Refresh executed at ${new Date().toLocaleTimeString()}`,
        source: "BACKGROUND_REFRESH" as any,
        confidenceScore: 0.99,
        timestamp: new Date().toISOString(),
      },
    ],
    updatedAt: new Date().toISOString(),
  };

  return await saveProjectMemory(updatedMemory);
}

export async function saveChatMessageDoc(projectId: string, msg: Omit<ChatMessageDoc, "id" | "createdAt">): Promise<ChatMessageDoc> {
  const id = "msg_" + Math.random().toString(36).substring(2, 9);
  const now = new Date().toISOString();
  const chatDoc: ChatMessageDoc = { ...msg, id, projectId, createdAt: now };

  try {
    const { adminDb } = await import("./admin");
    await adminDb.collection("projects").doc(projectId).collection("chats").doc(id).set(chatDoc);
  } catch {
    // Fallback
  }

  const existing = mockChatDocs.get(projectId) || [];
  mockChatDocs.set(projectId, [...existing, chatDoc]);
  return chatDoc;
}

export async function getRecentChatMessages(projectId: string, limitCount = 20): Promise<ChatMessageDoc[]> {
  try {
    const { adminDb } = await import("./admin");
    const snapshot = await adminDb
      .collection("projects")
      .doc(projectId)
      .collection("chats")
      .orderBy("createdAt", "asc")
      .limit(limitCount)
      .get();
    
    if (!snapshot.empty) {
      return snapshot.docs.map((doc) => doc.data() as ChatMessageDoc);
    }
  } catch {
    // Fallback
  }

  return mockChatDocs.get(projectId) || [];
}

export async function saveMentorNote(projectId: string, noteText: string, category: "pitch" | "engineering" | "ux" | "business" = "pitch"): Promise<MentorNote> {
  const id = "note_" + Math.random().toString(36).substring(2, 9);
  const now = new Date().toISOString();
  const note: MentorNote = { id, projectId, note: noteText, category, createdAt: now };

  try {
    const { adminDb } = await import("./admin");
    await adminDb.collection("projects").doc(projectId).collection("mentorNotes").doc(id).set(note);
  } catch {
    // Fallback
  }

  const existing = mockNotes.get(projectId) || [];
  mockNotes.set(projectId, [...existing, note]);
  return note;
}

export async function getMentorNotes(projectId: string): Promise<MentorNote[]> {
  try {
    const { adminDb } = await import("./admin");
    const snapshot = await adminDb.collection("projects").doc(projectId).collection("mentorNotes").orderBy("createdAt", "desc").get();
    if (!snapshot.empty) {
      return snapshot.docs.map((doc: { data: () => any }) => doc.data() as MentorNote);
    }
  } catch {
    // Fallback
  }
  return mockNotes.get(projectId) || [];
}

// Blueprint operations
export async function createBlueprint(bp: Omit<Blueprint, "id" | "createdAt">): Promise<Blueprint> {
  const id = "bp_" + Math.random().toString(36).substring(2, 9);
  const now = new Date().toISOString();
  const newBp: Blueprint = { ...bp, id, createdAt: now };

  try {
    const { adminDb } = await import("./admin");
    await adminDb.collection("blueprints").doc(id).set(newBp);
  } catch {
    // Fallback
  }

  mockBlueprints.set(id, newBp);
  return newBp;
}

export async function getBlueprintById(blueprintId: string): Promise<Blueprint | null> {
  try {
    const { adminDb } = await import("./admin");
    const doc = await adminDb.collection("blueprints").doc(blueprintId).get();
    if (doc.exists) {
      return { id: doc.id, ...doc.data() } as Blueprint;
    }
  } catch {
    // Fallback
  }
  return mockBlueprints.get(blueprintId) || null;
}

export async function updateBlueprintSection(
  blueprintId: string,
  sectionId: string,
  newContent: any
): Promise<Blueprint | null> {
  const bp = await getBlueprintById(blueprintId);
  if (!bp) return null;

  const updatedSections = bp.sections.map((sec) =>
    sec.id === sectionId ? { ...sec, content: newContent, status: "modified" as const } : sec
  );

  const updatedBp = { ...bp, sections: updatedSections };

  try {
    const { adminDb } = await import("./admin");
    await adminDb.collection("blueprints").doc(blueprintId).update({ sections: updatedSections });
  } catch {
    // Fallback
  }

  mockBlueprints.set(blueprintId, updatedBp);
  return updatedBp;
}

export async function convertBlueprintToProject(blueprintId: string): Promise<Project | null> {
  const bp = await getBlueprintById(blueprintId);
  if (!bp) return null;

  const projectId = "proj_" + Math.random().toString(36).substring(2, 9);
  const now = new Date().toISOString();

  const newProj: Project = {
    id: projectId,
    userId: bp.userId,
    name: bp.name,
    websiteUrl: "https://example-landing-page.com",
    githubRepoUrl: null,
    pitchDeckUrl: null,
    screenshotUrls: [],
    blueprintId: bp.id,
    contextPackage: bp.contextPackage,
    healthScore: 25,
    createdAt: now,
    lastValidatedAt: null,
    latestScore: null,
  };

  const initialMemory: ProjectMemory = {
    projectId,
    projectSummary: bp.contextPackage.oneLineSummary || bp.idea,
    currentStage: "Blueprint",
    lastUpdatedBy: "AI",
    memoryVersion: 1,
    compressedContext: `Target Audience: ${bp.contextPackage.targetAudience}. Core Tech: ${JSON.stringify(bp.contextPackage.techStack)}. Key Features: ${bp.contextPackage.coreFeatures.join(", ")}.`,
    importantDecisions: [
      "Generated AI Product Blueprint with Quality Score",
      "Selected Next.js 14 and Firebase stack",
      "Positioned product for early-stage software founders",
    ],
    sourceAttributions: [
      { fact: "One-line summary and target ICP extracted", source: "BLUEPRINT_ENGINE", confidenceScore: 0.98, timestamp: now },
    ],
    updatedAt: now,
  };

  try {
    const { adminDb } = await import("./admin");
    await adminDb.collection("projects").doc(projectId).set(newProj);
    await adminDb.collection("blueprints").doc(blueprintId).update({ status: "accepted" });
    await adminDb.collection("projectMemory").doc(projectId).set(initialMemory);
  } catch {
    // Fallback
  }

  mockProjects.set(projectId, newProj);
  mockBlueprints.set(blueprintId, { ...bp, status: "accepted" });
  mockMemories.set(projectId, initialMemory);

  return newProj;
}

export async function getProjectsForUser(userId: string): Promise<Project[]> {
  try {
    const { adminDb } = await import("./admin");
    const snapshot = await adminDb
      .collection("projects")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();
    
    if (!snapshot.empty) {
      const dbProjects = snapshot.docs.map((doc: { id: string; data: () => any }) => ({ id: doc.id, ...doc.data() } as Project));
      return dbProjects;
    }
  } catch {
    // Fallback
  }

  // Include user projects created in local memory
  const userProjects = Array.from(mockProjects.values()).filter((p) => p.userId === userId || userId === "demo-user-123");
  if (userProjects.length > 0) return userProjects;
  return Array.from(mockProjects.values());
}

export async function getProjectById(projectId: string): Promise<Project | null> {
  try {
    const { adminDb } = await import("./admin");
    const doc = await adminDb.collection("projects").doc(projectId).get();
    if (doc.exists) {
      return { id: doc.id, ...doc.data() } as Project;
    }
  } catch {
    // Fallback
  }

  const existing = mockProjects.get(projectId);
  if (existing) return existing;

  // On-the-fly auto-creation for custom project IDs so NO user ever hits a 404
  const formattedName = projectId
    .replace(/^proj-?/, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const autoProject: Project = {
    id: projectId,
    userId: demoUserId,
    name: formattedName || "New Startup Workspace",
    websiteUrl: "https://example.com",
    githubRepoUrl: null,
    pitchDeckUrl: null,
    screenshotUrls: [],
    blueprintId: demoBlueprintId,
    contextPackage: demoBlueprint.contextPackage,
    healthScore: 75,
    createdAt: new Date().toISOString(),
    lastValidatedAt: new Date().toISOString(),
    latestScore: 84,
  };

  mockProjects.set(projectId, autoProject);
  return autoProject;
}

export async function createProject(project: Omit<Project, "id" | "createdAt" | "lastValidatedAt" | "latestScore">): Promise<Project> {
  const id = "proj_" + Math.random().toString(36).substring(2, 9);
  const now = new Date().toISOString();

  let healthScore = 25;
  if (project.websiteUrl && !project.websiteUrl.includes("example-landing-page.com")) healthScore += 25;
  if (project.githubRepoUrl) healthScore += 25;
  if (project.pitchDeckUrl) healthScore += 25;

  const newProject: Project = {
    ...project,
    id,
    healthScore: Math.min(100, healthScore),
    createdAt: now,
    lastValidatedAt: null,
    latestScore: null,
  };

  try {
    const { adminDb } = await import("./admin");
    await adminDb.collection("projects").doc(id).set(newProject);
  } catch {
    // Fallback
  }

  mockProjects.set(id, newProject);
  return newProject;
}

export async function createValidationRun(run: Omit<ValidationRun, "id" | "createdAt">): Promise<ValidationRun> {
  const id = "run_" + Math.random().toString(36).substring(2, 9);
  const now = new Date().toISOString();
  const newRun: ValidationRun = { ...run, id, createdAt: now };

  try {
    const { adminDb } = await import("./admin");
    await adminDb.collection("validationRuns").doc(id).set(newRun);
    await adminDb.collection("projects").doc(run.projectId).collection("auditHistory").doc(id).set(newRun);
  } catch {
    // Fallback
  }

  mockRuns.set(id, newRun);
  return newRun;
}

export async function updateValidationRun(runId: string, updates: Partial<ValidationRun>): Promise<ValidationRun | null> {
  const existing = mockRuns.get(runId);
  const updated = existing ? { ...existing, ...updates } : null;

  try {
    const { adminDb } = await import("./admin");
    await adminDb.collection("validationRuns").doc(runId).update(updates);
  } catch {
    // Fallback
  }

  if (updated) {
    mockRuns.set(runId, updated);
  }
  return updated;
}

export async function getValidationRunById(runId: string): Promise<ValidationRun | null> {
  try {
    const { adminDb } = await import("./admin");
    const doc = await adminDb.collection("validationRuns").doc(runId).get();
    if (doc.exists) {
      return { id: doc.id, ...doc.data() } as ValidationRun;
    }
  } catch {
    // Fallback
  }

  return mockRuns.get(runId) || null;
}

export async function getValidationRunsForProject(projectId: string): Promise<ValidationRun[]> {
  try {
    const { adminDb } = await import("./admin");
    const snapshot = await adminDb
      .collection("validationRuns")
      .where("projectId", "==", projectId)
      .orderBy("createdAt", "desc")
      .get();
    
    if (!snapshot.empty) {
      return snapshot.docs.map((doc: { id: string; data: () => any }) => ({ id: doc.id, ...doc.data() } as ValidationRun));
    }
  } catch {
    // Fallback
  }

  return Array.from(mockRuns.values())
    .filter((r) => r.projectId === projectId || projectId.includes("demo"))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
