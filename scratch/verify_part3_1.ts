import { buildContextAwareMermaidDiagram, getDomainCompetitors } from "../lib/modules/blueprint-generator";
import { autoRepairBlueprintConsistency } from "../lib/modules/consistency-engine";

async function verifyPart31AIIntelligence() {
  console.log("=========================================================");
  console.log("🧠 PART 3.1 AI INTELLIGENCE & BLUEPRINT REASONING TEST");
  console.log("=========================================================");

  const domains = [
    { name: "SaaS", industry: "SaaS / DevTools", idea: "Developer API monitoring dashboard", problem: "API downtime goes unnoticed until customers complain" },
    { name: "FinTech", industry: "FinTech / Banking", idea: "Automated invoice factoring & risk scoring", problem: "B2B SMBs wait 90 days for unpaid invoices" },
    { name: "Healthcare", industry: "Healthcare / Telemed", idea: "HIPAA compliant patient intake and pre-diagnosis AI", problem: "Clinicians spend 40% of time typing patient notes" },
    { name: "EdTech", industry: "EdTech / Learning", idea: "Adaptive AI math tutor for high school students", problem: "Students get stuck on algebra homework with generic video lessons" },
    { name: "AI Agent", industry: "AI Agent / Automation", idea: "Autonomous GitHub PR reviewer agent", problem: "Senior engineers spend 15h/week reviewing repetitive PRs" },
    { name: "E-Commerce", industry: "E-Commerce / Retail", idea: "Headless personalized recommendation storefront", problem: "Shopify stores have low 1.5% conversion rates due to static products" },
  ];

  let passed = 0;

  for (const d of domains) {
    console.log(`\n--- Testing Domain: ${d.name} (${d.industry}) ---`);
    
    // 1. Test Context-Aware Mermaid Builder
    const mermaid = buildContextAwareMermaidDiagram(d.industry, d.idea, d.problem);
    console.log(`  [Mermaid Diagram Generated]:\n${mermaid.split("\n").map(l => "    " + l).join("\n")}`);

    const hasValidSyntax = mermaid.startsWith("graph TD") && mermaid.includes("-->");
    if (hasValidSyntax) {
      console.log(`  ✅ [PASS] Valid context-aware Mermaid syntax for ${d.name}`);
    } else {
      console.error(`  ❌ [FAIL] Invalid Mermaid syntax for ${d.name}`);
      process.exit(1);
    }

    // 2. Test Domain Competitors Benchmarks
    const competitors = getDomainCompetitors(d.industry, d.idea, d.problem);
    console.log(`  [Competitors Benchmarked]: ${competitors.map(c => c.name).join(", ")}`);
    if (competitors.length >= 3) {
      console.log(`  ✅ [PASS] Domain-specific competitors benchmarked for ${d.name}`);
    } else {
      console.error(`  ❌ [FAIL] Missing competitors for ${d.name}`);
      process.exit(1);
    }

    // 3. Test Auto-Repair Cross-Section Consistency
    const mockBlueprint = {
      mermaidDiagram: mermaid,
      features: { mvpFeatures: ["User Login", "Stripe Subscription Payments"], futureFeatures: [], monetization: "$19/mo" },
      database: { collections: [], endpoints: [] }
    };
    const repaired = autoRepairBlueprintConsistency(mockBlueprint);

    const hasUsersCol = repaired.database.collections.some(c => c.name === "users");
    const hasPaymentInGraph = repaired.mermaidDiagram.toLowerCase().includes("payment") || repaired.mermaidDiagram.toLowerCase().includes("stripe");

    if (hasUsersCol && hasPaymentInGraph) {
      console.log(`  ✅ [PASS] Cross-section consistency auto-repaired cleanly for ${d.name}`);
    } else {
      console.error(`  ❌ [FAIL] Consistency auto-repair failed for ${d.name}`);
      process.exit(1);
    }

    passed++;
  }

  console.log("\n=========================================================");
  console.log(`📊 PART 3.1 DOMAIN SUITE: ${passed} / ${domains.length} DOMAINS PASSED (100%)`);
  console.log("=========================================================");
}

verifyPart31AIIntelligence().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
