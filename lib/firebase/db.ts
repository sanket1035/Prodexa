import { Project, ValidationRun } from "@/lib/types/schema";

// In-memory store fallback for zero-config local dev & demo safety
const mockProjects: Map<string, Project> = new Map();
const mockRuns: Map<string, ValidationRun> = new Map();

// Seed initial demo data for instant dashboard preview
const demoUserId = "demo-user-123";
const demoProjectId = "proj-prodexa-demo";
const demoRunId = "run-prodexa-1";

const demoProject: Project = {
  id: demoProjectId,
  userId: demoUserId,
  name: "Prodexa Readiness Platform",
  websiteUrl: "https://github.com/sanket1035/prodexa",
  githubRepoUrl: "https://github.com/sanket1035/prodexa",
  pitchDeckUrl: null,
  screenshotUrls: [],
  createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  lastValidatedAt: new Date().toISOString(),
  latestScore: 84,
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
      fixText: `MIT License

Copyright (c) 2026 Prodexa Team

Permission is hereby granted, free of charge, to any person obtaining a copy...`,
    },
    {
      id: "issue-2",
      category: "ux",
      severity: "high",
      title: "Primary Hero CTA lacks explicit contrast & target area",
      description: "Hero call-to-action button uses 3.2:1 contrast ratio against dark background. Target WCAG AA minimum of 4.5:1.",
      fixText: `<button className="bg-[#D97B3F] hover:bg-[#E88A4E] text-[#0B0C0E] font-medium px-5 py-2.5 rounded-[6px] focus-visible:outline-2 focus-visible:outline-[#D97B3F]">
  Validate Product
</button>`,
    },
    {
      id: "issue-3",
      category: "performance",
      severity: "medium",
      title: "Large uncompressed hero image asset",
      description: "Hero image payload is 1.4MB. Compress using WebP / AVIF format to improve First Contentful Paint.",
      fixText: `<Image src="/hero.webp" alt="Prodexa Dashboard" width={1200} height={630} priority quality={85} />`,
    },
    {
      id: "issue-4",
      category: "business",
      severity: "low",
      title: "Value proposition headline is feature-focused instead of outcome-driven",
      description: "Current headline 'An Autonomous Pre-Launch Readiness Platform' describes technical nature. Highlight the primary outcome.",
      fixText: `Launch With Confidence. Identify & Fix Pre-Launch Gaps in Under 90 Seconds.`,
    },
  ],
  roadmap: [
    { priority: "critical", title: "Add MIT License to repository root", estimatedEffort: "5 min" },
    { priority: "high", title: "Fix primary Hero CTA contrast to meet WCAG AA", estimatedEffort: "15 min" },
    { priority: "medium", title: "Optimize hero media assets to WebP", estimatedEffort: "20 min" },
    { priority: "low", title: "Refine value prop headline on landing page", estimatedEffort: "10 min" },
  ],
  createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  completedAt: new Date().toISOString(),
};

mockProjects.set(demoProjectId, demoProject);
mockRuns.set(demoRunId, demoRun);

// Firestore / Memory helper methods
export async function getProjectsForUser(userId: string): Promise<Project[]> {
  try {
    const { adminDb } = await import("./admin");
    const snapshot = await adminDb
      .collection("projects")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();
    
    if (!snapshot.empty) {
      return snapshot.docs.map((doc: { id: string; data: () => any }) => ({ id: doc.id, ...doc.data() } as Project));
    }
  } catch {
    // Graceful fallback to memory store
  }

  return Array.from(mockProjects.values()).filter((p) => p.userId === userId || userId === "demo-user-123");
}

export async function getProjectById(projectId: string): Promise<Project | null> {
  try {
    const { adminDb } = await import("./admin");
    const doc = await adminDb.collection("projects").doc(projectId).get();
    if (doc.exists) {
      return { id: doc.id, ...doc.data() } as Project;
    }
  } catch {
    // Graceful fallback
  }

  return mockProjects.get(projectId) || null;
}

export async function createProject(project: Omit<Project, "id" | "createdAt" | "lastValidatedAt" | "latestScore">): Promise<Project> {
  const id = "proj_" + Math.random().toString(36).substring(2, 9);
  const now = new Date().toISOString();
  const newProject: Project = {
    ...project,
    id,
    createdAt: now,
    lastValidatedAt: null,
    latestScore: null,
  };

  try {
    const { adminDb } = await import("./admin");
    await adminDb.collection("projects").doc(id).set(newProject);
  } catch {
    // Fallback save to memory
  }

  mockProjects.set(id, newProject);
  return newProject;
}

export async function createValidationRun(run: Omit<ValidationRun, "id" | "createdAt">): Promise<ValidationRun> {
  const id = "run_" + Math.random().toString(36).substring(2, 9);
  const now = new Date().toISOString();
  const newRun: ValidationRun = {
    ...run,
    id,
    createdAt: now,
  };

  try {
    const { adminDb } = await import("./admin");
    await adminDb.collection("validationRuns").doc(id).set(newRun);
  } catch {
    // Memory fallback
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
    // Fallback update
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
    .filter((r) => r.projectId === projectId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
