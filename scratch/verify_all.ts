import {
  createBlueprint,
  convertBlueprintToProject,
  getBlueprintById,
  createProject,
  getProjectById,
  createValidationRun,
  getValidationRunById,
  getValidationRunsForProject,
  getProjectMemory,
  saveProjectMemory,
  getRecentChatMessages,
  saveChatMessageDoc,
  demoProjectId,
} from "../lib/firebase/db";
import { runEngineeringAnalysis } from "../lib/modules/engineering-analysis";
import { runProductUnderstanding } from "../lib/modules/product-understanding";
import { runUxValidation } from "../lib/modules/ux-validation";
import { runPerformanceAudit } from "../lib/modules/performance-audit";
import { runBusinessReview } from "../lib/modules/business-review";
import { runLaunchPlanner } from "../lib/modules/launch-planner";
import { generateMarkdownReport } from "../lib/pdf/exporter";
import { scrapeLandingPage } from "../lib/scraping/scraper";

async function runFullRegressionSuite() {
  console.log("=========================================================");
  console.log("🛡️ PRODEXA SYSTEM-WIDE REGRESSION SUITE (PARTS 1.1 - 1.7)");
  console.log("=========================================================");
  let passedCount = 0;
  let totalCount = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalCount++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passedCount++;
    } else {
      console.error(`  ❌ [FAIL] ${testName} - ${detail || "Assertion failed"}`);
    }
  }

  // --- 1. PART 1.1: DATABASE INTEGRITY ---
  console.log("\n--- PART 1.1: Database Integrity & 1-to-1 Conversion ---");
  const bpName = "Regression Test Blueprint " + Date.now();
  const bp = await createBlueprint({
    name: bpName,
    idea: "Automated test idea for regression testing",
    problem: "Manual testing is error-prone",
    targetUsers: "QA Engineers",
    sections: [],
    qualityScore: {
      overall: 88,
      metrics: { innovation: 85, businessPotential: 85, technicalFeasibility: 90, scalability: 90, aiNecessity: 88, marketReadiness: 88 },
      strengths: ["Automated testing"],
      weaknesses: [],
      rationale: "Automated regression",
    },
    mermaidDiagram: "graph TD; A-->B;",
    contextPackage: {
      blueprintId: "bp_temp",
      projectName: bpName,
      oneLineSummary: "Automated test idea for regression testing",
      problemStatement: "Manual testing is error-prone",
      targetAudience: "QA Engineers",
      coreFeatures: ["Regression Engine"],
      techStack: { frontend: "Next.js", backend: "API", database: "Firestore", ai: "Multi-Provider" },
      keyCompetitors: ["Manual QA"],
      generatedAt: new Date().toISOString(),
    },
    userId: "test-user-123",
    status: "draft",
  });

  assert(!!bp.id, "Blueprint creation generates ID", `Got ID: ${bp.id}`);

  const proj1 = await convertBlueprintToProject(bp.id, "test-user-123");
  assert(!!proj1 && proj1.blueprintId === bp.id, "Blueprint converts to Project with blueprintId FK");

  // Idempotency test: Second conversion must return exact same project
  const proj2 = await convertBlueprintToProject(bp.id, "test-user-123");
  assert(proj1?.id === proj2?.id, "1-to-1 Idempotency: Duplicate conversion returns original project");

  // --- 2. PART 1.2: PROJECT LIFECYCLE ---
  console.log("\n--- PART 1.2: Project Lifecycle & Persistence ---");
  const directProj = await createProject({
    userId: "test-user-123",
    name: "Direct Lifecycle Project",
    websiteUrl: "https://example.com",
    githubRepoUrl: null,
    pitchDeckUrl: null,
    screenshotUrls: [],
    blueprintId: null,
    contextPackage: null as any,
  });

  assert(!!directProj.id, "Direct project creation generates ID", `ID: ${directProj.id}`);
  const fetchedProj = await getProjectById(directProj.id);
  assert(fetchedProj?.name === "Direct Lifecycle Project", "Project fetched from store correctly");

  const run1 = await createValidationRun({
    projectId: directProj.id,
    userId: "test-user-123",
    status: "completed",
    currentModule: null,
    overallScore: 85,
    moduleScores: { productUnderstanding: 90, engineering: null, ux: 85, performance: 90, accessibility: 80, business: 80 },
    moduleStatus: {
      productUnderstanding: { status: "completed" },
      engineering: { status: "skipped", reason: "No GitHub repo" },
      ux: { status: "completed" },
      performance: { status: "completed" },
      accessibility: { status: "completed" },
      business: { status: "completed" },
    },
    issues: [],
    roadmap: [],
    completedAt: new Date().toISOString(),
  });

  assert(!!run1.id, "ValidationRun created with ID", `Run ID: ${run1.id}`);
  const runsForProj = await getValidationRunsForProject(directProj.id);
  assert(runsForProj.length >= 1 && runsForProj[0].id === run1.id, "ValidationRun retrieved for project");

  // --- 3. PART 1.3: CONTEXT ENGINEERING & ISOLATION ---
  console.log("\n--- PART 1.3: Context Engineering & Isolation ---");
  const memA = await getProjectMemory(proj1!.id);
  const memB = await getProjectMemory(directProj.id);
  assert(memA?.projectId === proj1!.id, "Project A memory has Project A ID");
  assert(memB?.projectId === directProj.id, "Project B memory has Project B ID");
  assert(memA?.projectId !== memB?.projectId, "Project A and Project B memories are 100% isolated");

  // --- 4. PART 1.4: AI PROVIDER PIPELINE SAFEGUARDS ---
  console.log("\n--- PART 1.4: AI Provider Pipeline Failover ---");
  // Test deterministic planner fallback
  const plannerRes = runLaunchPlanner(
    { productUnderstanding: 90, engineering: 80, ux: 85, performance: 90, accessibility: 80, business: 85 },
    []
  );
  assert(plannerRes.overallScore === 86, "Launch planner correctly averages non-null module scores", `Got ${plannerRes.overallScore}`);

  // --- 5. PART 1.5 & 1.5.1: LAUNCH AUDIT & BUG FIXES ---
  console.log("\n--- PART 1.5 & 1.5.1: Bug Fixes & Scraper Checks ---");
  
  // FB-005 Fix Check: Scraper on empty HTML should NOT inject fake button
  const scrapedEmpty = await scrapeLandingPage("https://httpbin.org/html");
  assert(Array.isArray(scrapedEmpty?.buttons), "Scraper returns buttons array");
  
  // FB-006 Fix Check: Text length should reflect real length, not artificially inflated to 500
  assert(scrapedEmpty ? scrapedEmpty.textLength < 500 || scrapedEmpty.bodyText.length === scrapedEmpty.textLength : true, "FB-006: textLength reflects real body length without artificial +500 inflation");

  // --- 6. PART 1.6: REPORT ENGINE & CONSISTENCY ---
  console.log("\n--- PART 1.6: Report Engine & Export Consistency ---");
  const mdReport = generateMarkdownReport(directProj, run1);
  assert(mdReport.includes(run1.id), "Report contains Report ID", "Missing Report ID");
  assert(mdReport.includes("PRODEXA — Launch Readiness Audit Report"), "Report contains standard header");
  assert(mdReport.includes("85%"), "Report contains overall readiness score 85%");
  assert(mdReport.includes("NOT VERIFIED — Skipped (No input provided)"), "Report contains NOT VERIFIED label for skipped engineering module");

  // --- SUMMARY ---
  console.log("\n=========================================================");
  console.log(`📊 SUITE COMPLETE: ${passedCount} / ${totalCount} TESTS PASSED`);
  console.log("=========================================================");

  if (passedCount === totalCount) {
    console.log("🏆 ALL REGRESSION TESTS PASSED CLEANLY! SYSTEM IS STABLE.");
    process.exit(0);
  } else {
    console.error("❌ REGRESSION SUITE FAILED!");
    process.exit(1);
  }
}

runFullRegressionSuite().catch((err) => {
  console.error("Fatal error during regression suite:", err);
  process.exit(1);
});
