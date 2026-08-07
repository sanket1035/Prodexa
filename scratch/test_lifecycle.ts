import {
  createBlueprint,
  convertBlueprintToProject,
  createProject,
  createValidationRun,
  getProjectsForUser,
  getProjectById,
  getValidationRunsForProject,
  getProjectMemory,
  updateProject,
} from "../lib/firebase/db";

// Prevent GCP ADC warnings from stopping test execution in local CLI environment
process.on("unhandledRejection", () => {
  // Ignore Firestore credential warning in local test CLI
});

async function runLifecycleVerification() {
  console.log("=================================================");
  console.log("🔴 PART 1.2 — Project Lifecycle Verification Test");
  console.log("=================================================");

  const testUserId = "user_test_lifecycle_100";
  const createdProjectIds: string[] = [];

  // Phase 1: Create 5 Option A Projects (Blueprint -> Project -> Audit)
  console.log("\n--- Phase 1: Creating 5 Option A Projects (Blueprint Conversion) ---");
  for (let i = 1; i <= 5; i++) {
    const bp = await createBlueprint({
      userId: testUserId,
      name: `Option A Product ${i} — AI Engine`,
      idea: `AI powered product idea #${i} for automated workflow optimization`,
      problem: `Manual effort required for process #${i}`,
      targetUsers: "Enterprise teams and developers",
      sections: [],
      mermaidDiagram: "graph TD;\n  A[Frontend] --> B[API]",
      contextPackage: {
        blueprintId: `bp_test_${i}`,
        projectName: `Option A Product ${i}`,
        oneLineSummary: `Product #${i}`,
        problemStatement: `Problem #${i}`,
        targetAudience: "Developers",
        coreFeatures: ["Feature 1"],
        techStack: { frontend: "Next.js 14", backend: "Next.js API", database: "Firestore", ai: "Gemini / Groq" },
        keyCompetitors: ["Manual Audits", "Generic AI"],
        generatedAt: new Date().toISOString(),
      },
      qualityScore: {
        overall: 85 + i,
        metrics: { innovation: 80, businessPotential: 85, technicalFeasibility: 90, scalability: 88, aiNecessity: 84, marketReadiness: 86 },
        strengths: ["Strong technical foundation"],
        weaknesses: ["Needs market expansion"],
        rationale: "Automated test score",
      },
      status: "draft",
    });

    const project = await convertBlueprintToProject(bp.id, testUserId);
    if (!project) throw new Error(`Failed to convert blueprint ${bp.id}`);

    // Verify 1-to-1 conversion idempotency
    const convertedAgain = await convertBlueprintToProject(bp.id, testUserId);
    if (!convertedAgain || convertedAgain.id !== project.id) {
      throw new Error(`Idempotency failure! Blueprint ${bp.id} converted into two different projects`);
    }

    createdProjectIds.push(project.id);
    console.log(`✓ Option A [${i}/5] Created Project ID: ${project.id} (Blueprint ID: ${bp.id})`);
  }

  // Phase 2: Create 5 Option B Projects (Direct Launch Audit -> Project)
  console.log("\n--- Phase 2: Creating 5 Option B Projects (Direct Launch Audit) ---");
  for (let i = 1; i <= 5; i++) {
    const project = await createProject({
      userId: testUserId,
      name: `Option B Web App ${i}`,
      websiteUrl: `https://option-b-test-${i}.vercel.app`,
      githubRepoUrl: `https://github.com/test-org/option-b-repo-${i}`,
      pitchDeckUrl: null,
      screenshotUrls: [],
    });

    createdProjectIds.push(project.id);
    console.log(`✓ Option B [${i}/5] Created Project ID: ${project.id}`);
  }

  // Phase 3: Execute Audit Runs on All 10 Projects
  console.log("\n--- Phase 3: Executing Audit Runs for All 10 Projects ---");
  for (const pid of createdProjectIds) {
    const now = new Date().toISOString();
    const run = await createValidationRun({
      projectId: pid,
      userId: testUserId,
      status: "completed",
      currentModule: null,
      overallScore: 82 + (createdProjectIds.indexOf(pid) % 10),
      moduleScores: {
        productUnderstanding: 88,
        engineering: 80,
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
        { id: `iss_1_${pid}`, title: "Missing open-source license file", description: "Root directory lacks LICENSE", severity: "high", category: "engineering", fixText: "Add MIT license" }
      ],
      roadmap: [],
      completedAt: now,
    });

    await updateProject(pid, {
      latestScore: run.overallScore,
      lastValidatedAt: run.createdAt,
      healthScore: 100,
    });

    console.log(`✓ Audit Run ${run.id} created for Project ID: ${pid} (Score: ${run.overallScore}%)`);
  }

  // Phase 4: Lifecycle Assertion Verifications
  console.log("\n--- Phase 4: Verifying Lifecycle Rules & Integrity ---");

  // Assertion 1: Total Project Count
  const userProjects = await getProjectsForUser(testUserId);
  console.log(`-> User Project Count: ${userProjects.length} / 10`);
  if (userProjects.length !== 10) {
    throw new Error(`Project count mismatch! Expected 10, got ${userProjects.length}`);
  }

  // Assertion 2: Duplicate ID Check
  const idSet = new Set(userProjects.map((p) => p.id));
  if (idSet.size !== 10) {
    throw new Error(`Duplicate project IDs detected! Unique count: ${idSet.size} / 10`);
  }
  console.log("✓ Zero duplicate project IDs confirmed across 10 projects.");

  // Assertion 3: Audit Run Continuity & Score Persistence
  for (const pid of createdProjectIds) {
    const proj = await getProjectById(pid);
    if (!proj) throw new Error(`Project ${pid} not found by ID!`);

    const runs = await getValidationRunsForProject(pid);
    if (runs.length === 0) throw new Error(`Audit history missing for project ${pid}`);
    if (proj.latestScore !== runs[0].overallScore) {
      throw new Error(`Score mismatch for ${pid}! Project score: ${proj.latestScore}, Run score: ${runs[0].overallScore}`);
    }

    const memory = await getProjectMemory(pid);
    if (!memory) throw new Error(`Project context memory missing for ${pid}`);

    console.log(`✓ Verified Single ID Continuity for ${pid}: Score=${proj.latestScore}%, HistoryRuns=${runs.length}, MemoryStage=${memory.currentStage}`);
  }

  console.log("\n=================================================");
  console.log("✅ PART 1.2 — All 10 Projects Lifecycle Assertions Passed!");
  console.log("=================================================");
}

runLifecycleVerification().catch((err) => {
  console.error("❌ Lifecycle verification failed:", err);
  process.exit(1);
});
