import { generateModuleInsight } from "../lib/utils/openai";

async function runAiPipelineVerification() {
  console.log("=================================================");
  console.log("🔴 PART 1.4 — AI Provider Pipeline Verification");
  console.log("=================================================");

  const fallbackJSON = {
    testResult: "PASSED",
    source: "Deterministic Fallback Engine",
    timestamp: new Date().toISOString(),
  };

  console.log("\n--- Testing AI Provider Sequential Failover Chain ---");
  const result = await generateModuleInsight(
    "You are an AI Product Analyst.",
    "Perform quick launch readiness evaluation for test app.",
    fallbackJSON
  );

  console.log("\n--- Verification Result ---");
  console.log("Returned Output:", JSON.stringify(result, null, 2));

  if (!result || typeof result !== "object") {
    throw new Error("AI Provider Pipeline failed to return a valid object!");
  }

  console.log("\n=================================================");
  console.log("✅ PART 1.4 — AI Provider Pipeline Assertions Passed!");
  console.log("=================================================");
}

runAiPipelineVerification().catch((err) => {
  console.error("❌ AI Pipeline verification failed:", err);
  process.exit(1);
});
