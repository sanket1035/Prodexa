import { Blueprint, BlueprintSection, ContextPackage } from "@/lib/types/blueprint";
import { generateModuleInsight } from "@/lib/utils/openai";
import { calculateHybridQualityScore } from "@/lib/modules/quality-score-engine";

export interface GenerateBlueprintInput {
  userId: string;
  name: string;
  idea: string;
  problem: string;
  targetUsers?: string;
  optionalFeatures?: string;
  optionalIndustry?: string;
  optionalConstraints?: string;
}

export async function generateAIBlueprint(input: GenerateBlueprintInput): Promise<Omit<Blueprint, "id" | "createdAt">> {
  const { name, idea, problem, targetUsers = "Early-stage founders and software teams" } = input;
  const industry = input.optionalIndustry || "SaaS / Software";

  // Build domain-aware dynamic Mermaid Architecture template
  let dynamicMermaid = `graph TD
    Client["Client Web App (Next.js 14 / React)"] --> API["Server API Router"]
    API --> Auth["Firebase Auth"]
    API --> DB["Firestore Database"]
    API --> AI["Gemini / OpenAI Engine"]`;

  const lowerInd = (industry + " " + idea + " " + problem).toLowerCase();
  if (lowerInd.includes("shop") || lowerInd.includes("store") || lowerInd.includes("e-commerce") || lowerInd.includes("cart") || lowerInd.includes("commerce")) {
    dynamicMermaid = `graph TD
    Client["Shopper Storefront (Next.js 14)"] --> API["E-Commerce API Service"]
    API --> Payment["Stripe Payment Gateway"]
    API --> Inventory["Inventory & Order Queue"]
    API --> DB["Product Catalog DB"]
    API --> Analytics["Sales & Recommendation AI"]`;
  } else if (lowerInd.includes("health") || lowerInd.includes("doctor") || lowerInd.includes("patient") || lowerInd.includes("medical")) {
    dynamicMermaid = `graph TD
    Client["Patient & Doctor Portal"] --> API["HIPAA-Compliant API Gateway"]
    API --> Auth["Encrypted Auth Service"]
    API --> EHR["Patient EHR Database"]
    API --> Appt["Appointment Scheduler"]
    API --> AI["Diagnostic Insights AI"]`;
  } else if (lowerInd.includes("edtech") || lowerInd.includes("course") || lowerInd.includes("learn") || lowerInd.includes("student") || lowerInd.includes("education")) {
    dynamicMermaid = `graph TD
    Client["Student Learning Interface"] --> API["Course Engine API"]
    API --> Video["HLS Video Streaming CDN"]
    API --> DB["Student Progress DB"]
    API --> Quiz["AI Quiz & Assessment Engine"]`;
  } else if (lowerInd.includes("fintech") || lowerInd.includes("crypto") || lowerInd.includes("bank") || lowerInd.includes("payment")) {
    dynamicMermaid = `graph TD
    Client["Financial Dashboard UI"] --> API["Secure Transaction Gateway"]
    API --> Ledger["Immutable Audit Ledger"]
    API --> Fraud["AI Fraud Detection Engine"]
    API --> Banking["Open Banking API Integration"]`;
  }

  const systemPrompt = `You are a Principal Technical Architect & Venture Partner. 
Analyze the startup idea and generate a structured startup blueprint JSON object with:
1. "qualityScore": { 
     "overall": number(0-100), 
     "metrics": { "innovation": number, "businessPotential": number, "technicalFeasibility": number, "scalability": number, "aiNecessity": number, "marketReadiness": number }, 
     "metricDetails": {
       "technicalFeasibility": { "value": number, "reason": string, "confidence": number },
       "businessPotential": { "value": number, "reason": string, "confidence": number },
       "innovation": { "value": number, "reason": string, "confidence": number },
       "scalability": { "value": number, "reason": string, "confidence": number },
       "marketReadiness": { "value": number, "reason": string, "confidence": number },
       "aiNecessity": { "value": number, "reason": string, "confidence": number }
     },
     "strengths": string[], 
     "weaknesses": string[], 
     "rationale": string 
   }
2. "mermaidDiagram": string (a valid Mermaid 'graph TD' diagram custom-fitted to the industry domain: '${industry}')
3. "foundation": { "problemStatement": string, "solutionStatement": string, "targetICP": string }
4. "market": { "competitors": Array<{ name: string, strength: string, weakness: string }>, "marketGaps": string, "investorNotes": string }
5. "features": { "mvpFeatures": string[], "futureFeatures": string[], "monetization": string }
6. "tech": { "techStack": { "frontend": string, "backend": string, "database": string, "ai": string }, "riskAnalysis": Array<{ risk: string, mitigation: string }> }
7. "database": { "collections": Array<{ name: string, fields: string }>, "endpoints": Array<{ method: string, path: string, desc: string }> }
8. "risks": { "folderTree": string, "developmentPhases": Array<{ phase: string, title: string, effort: string }> }

Output strictly JSON.`;

  const userContent = `Project Name: ${name}
Idea Description: ${idea}
Problem Statement: ${problem}
Target Users: ${targetUsers}
Industry: ${industry}
Constraints: ${input.optionalConstraints || "24-30h hackathon build scope"}`;

  // Dynamic Fallback Score computation (50% Deterministic + Fallback Mode)
  const dynamicFallbackScore = calculateHybridQualityScore({
    name,
    idea,
    problem,
    targetUsers,
    industry,
    isFallback: true,
  });

  const fallbackJSON = {
    qualityScore: dynamicFallbackScore,
    mermaidDiagram: dynamicMermaid,
    foundation: {
      problemStatement: problem,
      solutionStatement: `${name} provides an automated, structured operating system to validate and launch ${idea}.`,
      targetICP: targetUsers,
    },
    market: {
      competitors: [
        { name: "Generic Alternative", strength: "Established brand", weakness: "Lacks specialized automation workflow" },
        { name: "Manual Consultants", strength: "Custom human review", weakness: "High cost ($2,000+) and days of turnaround latency" },
      ],
      marketGaps: `No automated tool connects Day 0 idea planning for ${name} directly with pre-launch verification.`,
      investorNotes: `${name} addresses a growing market in ${industry} seeking instant automated validation.`,
    },
    features: {
      mvpFeatures: [
        `Core ${name} User Interface & Dashboard`,
        "Automated AI Blueprint Engine & Dynamic Hybrid Quality Score",
        "Domain-Aware Mermaid System Architecture Diagram",
        "One-Click Project Starter Kit Package Download",
      ],
      futureFeatures: ["Slack / Discord Webhook Notifications", "Automated GitHub OAuth Sync"],
      monetization: "Free tier for open-source builders; $19/mo Pro tier for team collaboration.",
    },
    tech: {
      techStack: {
        frontend: "Next.js 14 (App Router), TypeScript, Tailwind CSS",
        backend: "Next.js Server API Routes, Firebase Admin SDK",
        database: "Firebase Firestore",
        ai: "Gemini 1.5 Pro / OpenAI Engine",
      },
      riskAnalysis: [
        { risk: "Target URL blocks scraping", mitigation: "Graceful fallback DOM status response" },
        { risk: "API rate limits on external services", mitigation: "Caching and read-only token authorization" },
      ],
    },
    database: {
      collections: [
        { name: "users", fields: "uid, email, displayName, createdAt" },
        { name: "blueprints", fields: "id, name, qualityScore, mermaidDiagram, contextPackage" },
        { name: "projects", fields: "id, name, websiteUrl, githubRepoUrl, contextPackage, healthScore" },
        { name: "validationRuns", fields: "id, projectId, status, overallScore, moduleScores, issues" },
        { name: "cofounderThreads", fields: "projectId, messages, updatedAt" },
      ],
      endpoints: [
        { method: "POST", path: "/api/blueprint/generate", desc: "Generate AI Product Blueprint with Dynamic Quality Score" },
        { method: "POST", path: "/api/validate", desc: "Initiate 6-module Launch Readiness Audit" },
        { method: "POST", path: "/api/cofounder", desc: "Query AI Co-Founder Strategy Advisor" },
      ],
    },
    risks: {
      folderTree: `├── app/\n│   ├── page.tsx (Landing Page)\n│   ├── blueprint/new/page.tsx (Blueprint Generator)\n│   ├── projects/new/page.tsx (Launch Audit Form)\n│   ├── dashboard/[projectId]/page.tsx (Launch Report)\n│   └── api/ (Server API Routes)\n├── components/\n├── lib/\n└── public/`,
      developmentPhases: [
        { phase: "Phase 1", title: "Idea Blueprint & System Architecture", effort: "4 hrs" },
        { phase: "Phase 2", title: "Core MVP UI & Backend Endpoints", effort: "8 hrs" },
        { phase: "Phase 3", title: "Testing & Launch Readiness Audit", effort: "4 hrs" },
      ],
    },
  };

  const aiData = await generateModuleInsight(systemPrompt, userContent, fallbackJSON);

  // Compute final Dynamic Hybrid Quality Score (50% Deterministic + 50% AI metrics)
  const finalQualityScore = calculateHybridQualityScore({
    name,
    idea,
    problem,
    targetUsers,
    industry,
    aiMetrics: aiData.qualityScore?.metrics,
    aiReasonings: {
      technicalFeasibility: aiData.qualityScore?.metricDetails?.technicalFeasibility?.reason,
      businessPotential: aiData.qualityScore?.metricDetails?.businessPotential?.reason,
      innovation: aiData.qualityScore?.metricDetails?.innovation?.reason,
      scalability: aiData.qualityScore?.metricDetails?.scalability?.reason,
      aiNecessity: aiData.qualityScore?.metricDetails?.aiNecessity?.reason,
      marketReadiness: aiData.qualityScore?.metricDetails?.marketReadiness?.reason,
    },
    isFallback: !aiData.qualityScore || aiData === fallbackJSON,
  });

  const contextPackage: ContextPackage = {
    blueprintId: "",
    projectName: name,
    oneLineSummary: `${name} — ${idea.substring(0, 80)}`,
    problemStatement: problem,
    targetAudience: targetUsers,
    coreFeatures: aiData.features?.mvpFeatures || fallbackJSON.features.mvpFeatures,
    techStack: aiData.tech?.techStack || fallbackJSON.tech.techStack,
    keyCompetitors: (aiData.market?.competitors || fallbackJSON.market.competitors).map((c: any) => c.name),
    generatedAt: new Date().toISOString(),
  };

  const sections: BlueprintSection[] = [
    { id: "sec-1", title: "Product Foundation & Value Proposition", category: "foundation", content: aiData.foundation || fallbackJSON.foundation, status: "accepted" },
    { id: "sec-2", title: "Market Landscape & Competitor Audit", category: "market", content: aiData.market || fallbackJSON.market, status: "accepted" },
    { id: "sec-3", title: "Core MVP Feature Specification", category: "features", content: aiData.features || fallbackJSON.features, status: "accepted" },
    { id: "sec-4", title: "Tech Stack & Architecture Blueprint", category: "tech", content: aiData.tech || fallbackJSON.tech, status: "accepted" },
    { id: "sec-5", title: "Firestore Schema & API Payload Contracts", category: "database", content: aiData.database || fallbackJSON.database, status: "accepted" },
    { id: "sec-6", title: "Risk Mitigation & Development Roadmap", category: "risks", content: aiData.risks || fallbackJSON.risks, status: "accepted" },
  ];

  return {
    userId: input.userId,
    name,
    idea,
    problem,
    targetUsers,
    optionalIndustry: input.optionalIndustry,
    optionalConstraints: input.optionalConstraints,
    qualityScore: finalQualityScore,
    mermaidDiagram: aiData.mermaidDiagram || dynamicMermaid,
    sections,
    contextPackage,
    status: "accepted",
  };
}
