const { calculateHybridQualityScore } = require("../lib/modules/quality-score-engine");

const projects = [
  { name: "QuickBite", idea: "Food delivery app connecting local cloud kitchens with office workers", problem: "Office workers waste 45m finding healthy lunch", industry: "Food Delivery" },
  { name: "PharmaMatch", idea: "AI-powered target discovery platform for oncology drug candidates", problem: "Pharma R&D takes 10+ years to identify small molecule targets", industry: "AI Drug Discovery" },
  { name: "FitPulse", idea: "Gym management system for class booking, member check-ins, and locker rentals", problem: "Local gyms struggle with member retention and manual paper check-ins", industry: "Local Gym Management" },
  { name: "PayShield", idea: "Cross-border payment clearinghouse for Latin American SMB exporters", problem: "High 4% FX fees and 3-day wire delays for international trade", industry: "FinTech" },
  { name: "CodeTutor", idea: "Interactive AI coding tutor with adaptive quiz generation for bootcamps", problem: "Bootcamp students drop out due to lack of 1-on-1 TA assistance", industry: "EdTech" },
  { name: "SecureLog", idea: "Zero-trust SIEM log aggregator for SOC compliance monitoring", problem: "DevOps teams miss critical security breaches in noisy logs", industry: "Cybersecurity SaaS" },
  { name: "LaundroNet", idea: "IoT-enabled smart washer scheduling app for coin laundromats", problem: "Customers wait in line for open washing machines during peak hours", industry: "Local Laundromat" },
  { name: "GenomicsAI", idea: "Generative AI engine for personalized CRISPR gene therapy design", problem: "Off-target cleavage risks delay clinical gene therapy trials", industry: "Biotech AI" },
  { name: "EstateFlow", idea: "Real estate property management & tenant portal for commercial landlords", problem: "Landlords track rent payments manually on Excel spreadsheets", industry: "PropTech SaaS" },
  { name: "QuantumSim", idea: "Quantum circuit simulator for chemical battery material research", problem: "Classical supercomputers cannot model complex electrolyte reactions", industry: "Quantum Computing" },
];

console.log("==========================================================================");
console.log("DYNAMIC HYBRID QUALITY SCORE VERIFICATION (10 UNIQUE PROJECTS)");
console.log("==========================================================================\n");

const scoreSummary = [];

for (const p of projects) {
  const result = calculateHybridQualityScore({
    name: p.name,
    idea: p.idea,
    problem: p.problem,
    industry: p.industry,
  });

  scoreSummary.push({
    name: p.name,
    industry: p.industry,
    overall: result.overall,
    innovation: result.metrics.innovation,
    feasibility: result.metrics.technicalFeasibility,
    scalability: result.metrics.scalability,
    business: result.metrics.businessPotential,
    aiValue: result.metrics.aiNecessity,
    market: result.metrics.marketReadiness,
  });

  console.log(`📌 Project: ${p.name} (${p.industry})`);
  console.log(`   ├─ Final Overall Score: ${result.overall}/100`);
  console.log(`   ├─ Innovation: ${result.metrics.innovation}% | Feasibility: ${result.metrics.technicalFeasibility}% | Scalability: ${result.metrics.scalability}%`);
  console.log(`   ├─ Business Potential: ${result.metrics.businessPotential}% | AI Value: ${result.metrics.aiNecessity}% | Market: ${result.metrics.marketReadiness}%`);
  console.log(`   └─ Rationale: ${result.rationale}\n`);
}

console.log("==========================================================================");
console.log("SCORE VARIATION SUMMARY TABLE");
console.log("==========================================================================");
console.table(scoreSummary);
