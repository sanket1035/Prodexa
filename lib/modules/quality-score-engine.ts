import { BlueprintQualityScore, MetricDetail } from "@/lib/types/blueprint";

export interface CalculateScoreInput {
  name: string;
  idea: string;
  problem: string;
  targetUsers?: string;
  industry?: string;
  aiMetrics?: {
    innovation?: number;
    businessPotential?: number;
    technicalFeasibility?: number;
    scalability?: number;
    aiNecessity?: number;
    marketReadiness?: number;
  };
  aiReasonings?: {
    innovation?: string;
    businessPotential?: string;
    technicalFeasibility?: string;
    scalability?: string;
    aiNecessity?: string;
    marketReadiness?: string;
  };
  isFallback?: boolean;
}

export function calculateHybridQualityScore(input: CalculateScoreInput): BlueprintQualityScore {
  const ideaLower = (input.idea + " " + input.problem + " " + (input.industry || "")).toLowerCase();

  // --------------------------------------------------------------------------
  // 1. DETERMINISTIC HEURISTIC SCORING (50% WEIGHT)
  // --------------------------------------------------------------------------

  // A. Deterministic Innovation Score
  let detInnovation = 72;
  if (ideaLower.includes("drug") || ideaLower.includes("quantum") || ideaLower.includes("genomics") || ideaLower.includes("space") || ideaLower.includes("fusion")) {
    detInnovation = 96;
  } else if (ideaLower.includes("ai") || ideaLower.includes("llm") || ideaLower.includes("agent") || ideaLower.includes("autonomous") || ideaLower.includes("neural")) {
    detInnovation = 88;
  } else if (ideaLower.includes("food delivery") || ideaLower.includes("gym") || ideaLower.includes("booking") || ideaLower.includes("laundry") || ideaLower.includes("salon")) {
    detInnovation = 48;
  } else if (ideaLower.includes("saas") || ideaLower.includes("devtools") || ideaLower.includes("crm") || ideaLower.includes("analytics")) {
    detInnovation = 76;
  } else if (ideaLower.includes("health") || ideaLower.includes("fintech") || ideaLower.includes("edtech")) {
    detInnovation = 80;
  }

  // B. Deterministic Technical Feasibility Score
  let detFeasibility = 85;
  if (ideaLower.includes("gym") || ideaLower.includes("laundry") || ideaLower.includes("blog") || ideaLower.includes("todo") || ideaLower.includes("booking")) {
    detFeasibility = 98; // Simple CRUD stack
  } else if (ideaLower.includes("food delivery") || ideaLower.includes("e-commerce") || ideaLower.includes("marketplace")) {
    detFeasibility = 92; // Standard APIs available
  } else if (ideaLower.includes("saas") || ideaLower.includes("analytics") || ideaLower.includes("edtech")) {
    detFeasibility = 90;
  } else if (ideaLower.includes("fintech") || ideaLower.includes("health") || ideaLower.includes("crypto")) {
    detFeasibility = 74; // High compliance & regulatory risk
  } else if (ideaLower.includes("drug") || ideaLower.includes("quantum") || ideaLower.includes("fusion") || ideaLower.includes("robotics")) {
    detFeasibility = 58; // R&D hardware/scientific risk
  }

  // C. Deterministic Scalability Score
  let detScalability = 80;
  if (ideaLower.includes("saas") || ideaLower.includes("devtools") || ideaLower.includes("ai") || ideaLower.includes("api")) {
    detScalability = 94; // Digital marginal cost ~$0
  } else if (ideaLower.includes("edtech") || ideaLower.includes("fintech")) {
    detScalability = 85;
  } else if (ideaLower.includes("health") || ideaLower.includes("drug")) {
    detScalability = 72;
  } else if (ideaLower.includes("food delivery") || ideaLower.includes("marketplace")) {
    detScalability = 68; // Logistics operations overhead
  } else if (ideaLower.includes("gym") || ideaLower.includes("laundry") || ideaLower.includes("salon")) {
    detScalability = 56; // Physical location constraint
  }

  // D. Deterministic Business Potential Score
  let detBusiness = 78;
  if (ideaLower.includes("b2b") || ideaLower.includes("enterprise") || ideaLower.includes("fintech") || ideaLower.includes("cybersecurity")) {
    detBusiness = 92; // High contract values
  } else if (ideaLower.includes("saas") || ideaLower.includes("health") || ideaLower.includes("drug")) {
    detBusiness = 86;
  } else if (ideaLower.includes("food delivery") || ideaLower.includes("edtech")) {
    detBusiness = 75;
  } else if (ideaLower.includes("gym") || ideaLower.includes("laundry")) {
    detBusiness = 64; // Low ARPU local business
  }

  // E. Deterministic Market Readiness Score
  let detMarket = 75;
  if (input.problem && input.problem.length > 50) detMarket += 10;
  if (input.targetUsers && input.targetUsers.length > 20) detMarket += 5;
  detMarket = Math.min(95, Math.max(50, detMarket));

  // F. Deterministic AI Necessity Score
  let detAiNecessity = 70;
  if (ideaLower.includes("ai") || ideaLower.includes("llm") || ideaLower.includes("agent") || ideaLower.includes("neural") || ideaLower.includes("ml")) {
    detAiNecessity = 95;
  } else if (ideaLower.includes("analytics") || ideaLower.includes("recommendation") || ideaLower.includes("automation")) {
    detAiNecessity = 78;
  } else if (ideaLower.includes("gym") || ideaLower.includes("laundry") || ideaLower.includes("booking") || ideaLower.includes("food delivery")) {
    detAiNecessity = 38; // AI is optional / nice-to-have wrapper
  }

  // --------------------------------------------------------------------------
  // 2. HYBRID COMBINATION (50% DETERMINISTIC + 50% AI EVALUATION)
  // --------------------------------------------------------------------------

  const aiM = input.aiMetrics || {};
  const aiR = input.aiReasonings || {};

  const combine = (det: number, aiVal?: number) => {
    if (aiVal !== undefined && !isNaN(aiVal) && aiVal > 0) {
      return Math.round(0.50 * det + 0.50 * aiVal);
    }
    return det; // Pure deterministic if AI metric absent
  };

  const finalInnovation = combine(detInnovation, aiM.innovation);
  const finalFeasibility = combine(detFeasibility, aiM.technicalFeasibility);
  const finalScalability = combine(detScalability, aiM.scalability);
  const finalBusiness = combine(detBusiness, aiM.businessPotential);
  const finalMarket = combine(detMarket, aiM.marketReadiness);
  const finalAiNecessity = combine(detAiNecessity, aiM.aiNecessity);

  // --------------------------------------------------------------------------
  // 3. WEIGHTED OVERALL QUALITY SCORE FORMULA
  // Formula: 25% Innovation + 20% Feasibility + 20% Business + 15% Scalability + 10% Market + 10% AI Necessity
  // --------------------------------------------------------------------------

  const weightedScore = Math.round(
    0.25 * finalInnovation +
    0.20 * finalFeasibility +
    0.20 * finalBusiness +
    0.15 * finalScalability +
    0.10 * finalMarket +
    0.10 * finalAiNecessity
  );

  const overall = Math.max(35, Math.min(99, weightedScore));

  const sourceLabel = input.isFallback
    ? ("Estimated Score (Fallback Mode)" as const)
    : ("Hybrid Engine (50% Det + 50% AI)" as const);

  const metricDetails = {
    technicalFeasibility: {
      value: finalFeasibility,
      reason: aiR.technicalFeasibility || (finalFeasibility >= 85 ? "Existing mature tech stack with minimal dev risk" : "High technical R&D or compliance risk"),
      confidence: 96,
      formulaBreakdown: `Det (${detFeasibility}) × 0.50 + AI (${aiM.technicalFeasibility || detFeasibility}) × 0.50 = ${finalFeasibility}`,
      sourceLabel,
    },
    businessPotential: {
      value: finalBusiness,
      reason: aiR.businessPotential || (finalBusiness >= 80 ? "Scalable business model with high customer LTV" : "Moderate TAM with local market constraints"),
      confidence: 92,
      formulaBreakdown: `Det (${detBusiness}) × 0.50 + AI (${aiM.businessPotential || detBusiness}) × 0.50 = ${finalBusiness}`,
      sourceLabel,
    },
    innovation: {
      value: finalInnovation,
      reason: aiR.innovation || (finalInnovation >= 80 ? "Strong competitive moat and novel AI application" : "Standard market offering with existing competitors"),
      confidence: 94,
      formulaBreakdown: `Det (${detInnovation}) × 0.50 + AI (${aiM.innovation || detInnovation}) × 0.50 = ${finalInnovation}`,
      sourceLabel,
    },
    scalability: {
      value: finalScalability,
      reason: aiR.scalability || (finalScalability >= 80 ? "Stateless cloud architecture with near-zero marginal cost" : "Requires operational or physical expansion overhead"),
      confidence: 95,
      formulaBreakdown: `Det (${detScalability}) × 0.50 + AI (${aiM.scalability || detScalability}) × 0.50 = ${finalScalability}`,
      sourceLabel,
    },
    marketReadiness: {
      value: finalMarket,
      reason: aiR.marketReadiness || "Clear problem definition and identified target audience ICP",
      confidence: 90,
      formulaBreakdown: `Det (${detMarket}) × 0.50 + AI (${aiM.marketReadiness || detMarket}) × 0.50 = ${finalMarket}`,
      sourceLabel,
    },
    aiNecessity: {
      value: finalAiNecessity,
      reason: aiR.aiNecessity || (finalAiNecessity >= 75 ? "Core functionality fundamentally relies on AI inference" : "AI acts as an optional automation wrapper"),
      confidence: 98,
      formulaBreakdown: `Det (${detAiNecessity}) × 0.50 + AI (${aiM.aiNecessity || detAiNecessity}) × 0.50 = ${finalAiNecessity}`,
      sourceLabel,
    },
  };

  const strengths: string[] = [];
  if (finalFeasibility >= 85) strengths.push("High technical feasibility using mature Next.js/Firebase APIs");
  if (finalBusiness >= 80) strengths.push("Strong monetization potential with scalable customer acquisition");
  if (finalInnovation >= 80) strengths.push("Novel market approach with strong competitive differentiation");
  if (strengths.length === 0) strengths.push("Clear problem definition targeting specific user needs");

  const weaknesses: string[] = [];
  if (finalFeasibility < 75) weaknesses.push("High technical R&D complexity or regulatory compliance overhead");
  if (finalInnovation < 65) weaknesses.push("Crowded market segment requiring organic brand differentiation");
  if (finalScalability < 70) weaknesses.push("Requires operational overhead or physical location constraints");
  if (weaknesses.length === 0) weaknesses.push("Ongoing monitoring of external API latency and cloud infrastructure costs");

  const rationale = input.isFallback
    ? `[Estimated Score (Fallback Mode)] ${input.name} receives a calculated ${overall}/100 quality score derived from deterministic domain heuristics (Innovation ${finalInnovation}%, Feasibility ${finalFeasibility}%, Scalability ${finalScalability}%).`
    : `[Hybrid Engine (50% Det + 50% AI)] ${input.name} receives an audited ${overall}/100 quality score computed from 50% deterministic heuristics and 50% LLM context reasoning across Innovation (${finalInnovation}%), Feasibility (${finalFeasibility}%), and Business Potential (${finalBusiness}%).`;

  return {
    overall,
    metrics: {
      innovation: finalInnovation,
      businessPotential: finalBusiness,
      technicalFeasibility: finalFeasibility,
      scalability: finalScalability,
      aiNecessity: finalAiNecessity,
      marketReadiness: finalMarket,
    },
    metricDetails,
    strengths,
    weaknesses,
    rationale,
  };
}
