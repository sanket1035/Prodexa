import { Blueprint, BlueprintSection, BlueprintQualityScore, ContextPackage } from "@/lib/types/blueprint";
import { generateModuleInsight } from "@/lib/utils/openai";

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

  const systemPrompt = `You are a Principal Technical Architect & Venture Partner. 
Analyze the startup idea and generate a structured startup blueprint JSON object with:
1. "qualityScore": { "overall": number(0-100), "metrics": { "innovation": number, "businessPotential": number, "technicalFeasibility": number, "scalability": number, "aiNecessity": number, "marketReadiness": number }, "strengths": string[], "weaknesses": string[], "rationale": string }
2. "mermaidDiagram": string (a valid Mermaid 'graph TD' diagram representing Client -> API -> Services -> DB -> Deployment)
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
Industry: ${input.optionalIndustry || "Software / SaaS"}
Constraints: ${input.optionalConstraints || "24-30h hackathon build scope"}`;

  const defaultMermaid = `graph TD
    Client["Client Web App (Next.js 14 / Tailwind)"] --> API["Next.js API Server Routes"]
    API --> Auth["Firebase Authentication"]
    API --> DB["Firebase Firestore Database"]
    API --> AI["OpenAI Inference Engine"]
    API --> Host["Anti-Gravity / Vercel Serverless"]`;

  const fallbackJSON = {
    qualityScore: {
      overall: 87,
      metrics: {
        innovation: 88,
        businessPotential: 85,
        technicalFeasibility: 92,
        scalability: 89,
        aiNecessity: 84,
        marketReadiness: 86,
      },
      strengths: [
        "Addresses a clear, painful problem for early-stage software builders",
        "High technical feasibility using modern Next.js + Serverless stack",
        "Scalable SaaS revenue model with low initial infrastructure overhead",
      ],
      weaknesses: [
        "Initial customer acquisition requires organic community traction",
        "Requires ongoing monitoring of LLM API cost & latency thresholds",
      ],
      rationale: `${name} receives an 87/100 readiness score due to its well-defined target audience (${targetUsers}), immediate developer utility, and robust technical feasibility.`,
    },
    mermaidDiagram: defaultMermaid,
    foundation: {
      problemStatement: problem,
      solutionStatement: `${name} provides an automated, structured operating system to validate and launch ${idea}.`,
      targetICP: targetUsers,
    },
    market: {
      competitors: [
        { name: "Generic AI Chatbots", strength: "Broad knowledge base", weakness: "Unstructured, non-persistent conversational output" },
        { name: "Manual Consultants", strength: "Custom human review", weakness: "High financial cost ($2,000+) and days of turnaround latency" },
      ],
      marketGaps: "No automated tool connects Day 0 idea planning directly with pre-launch code analysis.",
      investorNotes: `${name} addresses a growing market of indie hackathon builders and early-stage founders seeking instant validation.`,
    },
    features: {
      mvpFeatures: [
        "Dual-Entry Landing Page (Idea OS vs Readiness Audit)",
        "Automated AI Blueprint Engine & Quality Score",
        "Auto-Generated Mermaid System Architecture",
        "One-Click Downloadable Project Starter Kit",
      ],
      futureFeatures: ["GitHub OAuth PR Creation", "Slack / Discord Webhook Notifications"],
      monetization: "Free tier for open-source builders; $19/mo Pro tier for team collaboration.",
    },
    tech: {
      techStack: {
        frontend: "Next.js 14 (App Router), TypeScript, Tailwind CSS",
        backend: "Next.js Server API Routes, Firebase Admin SDK",
        database: "Firebase Firestore",
        ai: "OpenAI GPT-4o-mini",
      },
      riskAnalysis: [
        { risk: "Target URL blocks scraping", mitigation: "Graceful fallback to 'Unable to analyze' status" },
        { risk: "API rate limits on external services", mitigation: "Caching and read-only token authorization" },
      ],
    },
    database: {
      collections: [
        { name: "blueprints", fields: "id, userId, name, qualityScore, mermaidDiagram, contextPackage" },
        { name: "projects", fields: "id, userId, name, websiteUrl, blueprintId, healthScore" },
        { name: "validationRuns", fields: "id, projectId, status, overallScore, moduleScores, issues" },
      ],
      endpoints: [
        { method: "POST", path: "/api/blueprint/generate", desc: "Generates 6-module blueprint & quality score" },
        { method: "POST", path: "/api/blueprint/[id]/convert", desc: "Converts blueprint to project & starter kit" },
        { method: "POST", path: "/api/validate", desc: "Executes 6 launch readiness audit modules" },
      ],
    },
    risks: {
      folderTree: `${name.toLowerCase().replace(/\s+/g, "-")}/\n├── app/\n├── components/\n├── lib/\n└── firestore.rules`,
      developmentPhases: [
        { phase: "Phase 1", title: "Idea Blueprint Engine & Quality Score", effort: "4 hrs" },
        { phase: "Phase 2", title: "Mermaid Visualizer & Starter Kit Exporter", effort: "3 hrs" },
        { phase: "Phase 3", title: "Launch Readiness Audit & Context Reuse", effort: "3 hrs" },
      ],
    },
  };

  const insight = await generateModuleInsight(systemPrompt, userContent, fallbackJSON);

  const qualityScore: BlueprintQualityScore = insight.qualityScore || fallbackJSON.qualityScore;
  const mermaidDiagram = insight.mermaidDiagram && insight.mermaidDiagram.includes("graph") ? insight.mermaidDiagram : fallbackJSON.mermaidDiagram;
  const foundationData = insight.foundation || fallbackJSON.foundation;
  const marketData = insight.market || fallbackJSON.market;
  const featuresData = insight.features || fallbackJSON.features;
  const techData = insight.tech || fallbackJSON.tech;
  const dbData = insight.database || fallbackJSON.database;
  const riskData = insight.risks || fallbackJSON.risks;

  const sections: BlueprintSection[] = [
    { id: "sec-foundation", title: "Product Foundation", category: "foundation", content: foundationData, status: "accepted" },
    { id: "sec-market", title: "Market & Competitors", category: "market", content: marketData, status: "accepted" },
    { id: "sec-features", title: "Feature Architecture", category: "features", content: featuresData, status: "accepted" },
    { id: "sec-tech", title: "Tech & System Design", category: "tech", content: techData, status: "accepted" },
    { id: "sec-database", title: "Database & API Contract", category: "database", content: dbData, status: "accepted" },
    { id: "sec-risks", title: "Folder & Development Plan", category: "risks", content: riskData, status: "accepted" },
  ];

  const contextPackage: ContextPackage = {
    blueprintId: "pending",
    projectName: name,
    oneLineSummary: foundationData.solutionStatement || idea,
    problemStatement: foundationData.problemStatement || problem,
    targetAudience: foundationData.targetICP || targetUsers,
    coreFeatures: featuresData.mvpFeatures || fallbackJSON.features.mvpFeatures,
    techStack: techData.techStack || fallbackJSON.tech.techStack,
    keyCompetitors: (marketData.competitors || []).map((c: any) => c.name),
    generatedAt: new Date().toISOString(),
  };

  return {
    userId: input.userId,
    name,
    idea,
    problem,
    targetUsers,
    qualityScore,
    mermaidDiagram,
    sections,
    contextPackage,
    status: "draft",
  };
}
