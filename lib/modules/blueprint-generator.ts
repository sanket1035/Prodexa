import { Blueprint, BlueprintSection, ContextPackage } from "@/lib/types/blueprint";
import { generateModuleInsight } from "@/lib/utils/openai";
import { calculateHybridQualityScore } from "@/lib/modules/quality-score-engine";
import { autoRepairBlueprintConsistency } from "@/lib/modules/consistency-engine";

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

export function buildContextAwareMermaidDiagram(industry: string, idea: string, problem: string): string {
  const combined = (industry + " " + idea + " " + problem).toLowerCase();

  const hasAuth = combined.includes("user") || combined.includes("login") || combined.includes("account") || combined.includes("auth") || combined.includes("patient") || combined.includes("student");
  const hasPayment = combined.includes("shop") || combined.includes("store") || combined.includes("cart") || combined.includes("pay") || combined.includes("billing") || combined.includes("subscrip") || combined.includes("monetiz");
  const hasAI = combined.includes("ai") || combined.includes("agent") || combined.includes("llm") || combined.includes("predict") || combined.includes("diagnos") || combined.includes("gpt") || combined.includes("recommend");
  const hasStorage = combined.includes("file") || combined.includes("pdf") || combined.includes("image") || combined.includes("video") || combined.includes("document") || combined.includes("record") || combined.includes("media");
  const hasNotify = combined.includes("alert") || combined.includes("notify") || combined.includes("email") || combined.includes("sms") || combined.includes("message");

  let diagram = "graph TD\n";

  if (combined.includes("health") || combined.includes("medical") || combined.includes("patient") || combined.includes("doctor") || combined.includes("clinic")) {
    diagram += `    Client["Patient & Clinician Portal (Next.js 14)"] --> API["HIPAA Gateway / Edge Router"]\n`;
    diagram += `    API --> Auth["OAuth2 / BAA Identity Provider"]\n`;
    if (hasAI) diagram += `    API --> AI["Diagnostic AI & Risk Scoring Engine"]\n`;
    diagram += `    API --> EHR["Patient EHR & Lab Records DB (Firestore)"]\n`;
    if (hasStorage) diagram += `    API --> Storage["Encrypted Cloud Storage (DICOM/PDF)"]\n`;
    if (hasNotify) diagram += `    API --> Notify["Patient SMS / Email Reminder Queue"]\n`;
  } else if (combined.includes("fintech") || combined.includes("bank") || combined.includes("payment") || combined.includes("crypto") || combined.includes("finance") || combined.includes("tax")) {
    diagram += `    Client["Financial Dashboard UI (React / Next.js)"] --> API["Secure PCI Gateway Service"]\n`;
    diagram += `    API --> Auth["JWT / Multi-Factor Auth Service"]\n`;
    diagram += `    API --> Bank["Open Banking & Plaid Connector"]\n`;
    if (hasPayment) diagram += `    API --> Payment["Stripe Payments & Settlement Service"]\n`;
    diagram += `    API --> Ledger["Immutable Transaction Ledger DB"]\n`;
    if (hasAI) diagram += `    API --> Fraud["AI Fraud Detection & Risk Pipeline"]\n`;
  } else if (combined.includes("edtech") || combined.includes("course") || combined.includes("learn") || combined.includes("school") || combined.includes("student")) {
    diagram += `    Client["Interactive Learning App (Next.js 14)"] --> API["Course Management API Router"]\n`;
    diagram += `    API --> Auth["Clerk / NextAuth User Service"]\n`;
    diagram += `    API --> CDN["HLS Video & Asset CDN"]\n`;
    diagram += `    API --> DB["Student Progress & Assessment DB"]\n`;
    if (hasAI) diagram += `    API --> Tutor["AI Personal Tutor & Quiz Generator"]\n`;
    if (hasPayment) diagram += `    API --> Payment["Subscription Billing Gateway"]\n`;
  } else if (combined.includes("agent") || combined.includes("automation") || combined.includes("workflow") || combined.includes("copilot") || combined.includes("ai assistant")) {
    diagram += `    Client["Agent Operating System Web App"] --> API["Orchestration Engine API Router"]\n`;
    diagram += `    API --> VectorDB["Pinecone / Weaviate Vector Store"]\n`;
    diagram += `    API --> LLM["Multi-Model AI Pipeline (OpenAI & Gemini)"]\n`;
    diagram += `    API --> Memory["Context Memory & History Store"]\n`;
    diagram += `    API --> Tools["External API Tool Executer"]\n`;
  } else if (combined.includes("shop") || combined.includes("store") || combined.includes("e-commerce") || combined.includes("cart") || combined.includes("commerce")) {
    diagram += `    Client["Shopper Storefront UI (Next.js 14)"] --> API["E-Commerce Core API Gateway"]\n`;
    if (hasAuth) diagram += `    API --> Auth["Customer Identity Service"]\n`;
    diagram += `    API --> Payment["Stripe Payment Gateway"]\n`;
    diagram += `    API --> Order["Order Processing & Inventory Queue"]\n`;
    diagram += `    API --> DB["Product Catalog DB (Firestore)"]\n`;
    if (hasAI) diagram += `    API --> AI["AI Personalization Engine"]\n`;
  } else {
    diagram += `    Client["Client Web App (Next.js 14 / TypeScript)"] --> API["Server API Gateway"]\n`;
    if (hasAuth) diagram += `    API --> Auth["Identity & Auth Service (Firebase)"]\n`;
    if (hasPayment) diagram += `    API --> Payment["Stripe Payment Gateway"]\n`;
    diagram += `    API --> DB["Primary Firestore Database"]\n`;
    if (hasAI) diagram += `    API --> AI["Gemini / OpenAI Intelligence Pipeline"]\n`;
    if (hasNotify) diagram += `    API --> Notify["Webhook & Notification Queue"]\n`;
  }

  return diagram;
}

export function getDomainCompetitors(industry: string, idea: string, problem: string) {
  const combined = (industry + " " + idea + " " + problem).toLowerCase();

  if (combined.includes("health") || combined.includes("medical") || combined.includes("patient") || combined.includes("clinic")) {
    return [
      { name: "Epic Systems / Cerner", strength: "Dominant EHR market share in enterprise hospital networks", weakness: "Legacy monoliths with complex integration cycles and high cost ($100k+)" },
      { name: "One Medical / Practo", strength: "Modern consumer clinic UI and direct appointment booking", weakness: "Limited automated diagnostic workflow and lack of AI pre-screening" },
      { name: "Manual Paper Workflows", strength: "Zero software cost and familiar clinician habit", weakness: "High administrative overhead, missing analytics, and risk of HIPAA compliance errors" }
    ];
  }

  if (combined.includes("fintech") || combined.includes("bank") || combined.includes("payment") || combined.includes("crypto") || combined.includes("tax")) {
    return [
      { name: "Plaid + Stripe Infrastructure", strength: "Industry-standard developer APIs for banking and payments", weakness: "Complex multi-service integration required to build custom financial workflows" },
      { name: "Brex / Ramp", strength: "Polished corporate spend management and card issuance", weakness: "Tailored strictly for venture-backed startups rather than custom niche financial workflows" },
      { name: "Manual Spreadsheets", strength: "Free and fully customizable by finance teams", weakness: "Prone to manual human error, lack of real-time audit trail, and zero fraud detection" }
    ];
  }

  if (combined.includes("edtech") || combined.includes("course") || combined.includes("learn") || combined.includes("school")) {
    return [
      { name: "Coursera / Udemy", strength: "Massive existing course catalog and global learner audience", weakness: "Passive video consumption with low completion rates (<10%) and zero personalized AI tutoring" },
      { name: "Canvas LMS / Blackboard", strength: "Established distribution in K-12 and university systems", weakness: "Clunky legacy UI with zero real-time adaptive learning paths" },
      { name: "Generic Notion / YouTube", strength: "Free and easy to share content", weakness: "No progress tracking, assessment engine, or structured learning feedback loop" }
    ];
  }

  if (combined.includes("agent") || combined.includes("automation") || combined.includes("workflow") || combined.includes("copilot")) {
    return [
      { name: "AutoGPT / BabyAGI Frameworks", strength: "Open-source developer community and multi-step reasoning models", weakness: "High token cost, infinite loops, and lack of enterprise safety guardrails" },
      { name: "LangChain / CrewAI", strength: "Flexible agent composition libraries for Python and JS", weakness: "Requires heavy custom coding; lacks out-of-the-box UI/UX for non-technical users" },
      { name: "Manual Scripting", strength: "Full control over custom business logic", weakness: "High maintenance overhead, brittle API hooks, and zero autonomous reasoning" }
    ];
  }

  if (combined.includes("shop") || combined.includes("store") || combined.includes("e-commerce") || combined.includes("cart")) {
    return [
      { name: "Shopify / WooCommerce", strength: "Massive plugin ecosystem and easy template setup", weakness: "High recurring app subscription fees and limited custom AI recommendation flexibility" },
      { name: "Medusa.js / Commerce Layer", strength: "Headless open-source commerce for developers", weakness: "Requires custom engineering setup and dedicated hosting management" },
      { name: "Manual Marketplace (Etsy/Amazon)", strength: "Built-in marketplace traffic", weakness: "High take-rate fees (15%+) and zero customer relationship ownership" }
    ];
  }

  return [
    { name: "Linear / Vercel Workspace Tools", strength: "Crisp SaaS design and developer adoption", weakness: "Built for general project management rather than specialized product blueprinting" },
    { name: "Manual Product Consultants", strength: "Custom human review and high-touch guidance", weakness: "High cost ($2,500+ per engagement) and slow 2-week delivery turnaround" },
    { name: "Generic ChatGPT / LLM Wrappers", strength: "Fast response generation for simple prompts", weakness: "Generic output with zero cross-section consistency or deterministic architecture verification" }
  ];
}

export async function generateAIBlueprint(input: GenerateBlueprintInput): Promise<Omit<Blueprint, "id" | "createdAt">> {
  const { name, idea, problem, targetUsers = "Early-stage founders and software teams" } = input;
  const industry = input.optionalIndustry || "SaaS / Software";

  const dynamicMermaid = buildContextAwareMermaidDiagram(industry, idea, problem);
  const domainCompetitors = getDomainCompetitors(industry, idea, problem);

  const systemPrompt = `You are a Senior Principal Product Architect & YC Partner.
Generate an authoritative, highly specific, and internally consistent Product Blueprint for '${name}' in the domain '${industry}'.

CRITICAL ARCHITECTURAL RULES:
1. Avoid generic startup buzzwords. Every section MUST reference previous sections.
2. Problem -> Solution -> MVP Features -> Tech Stack -> Architecture Diagram -> Database Collections -> Roadmap MUST be 100% aligned.
3. Include explicit Explainability Fields (Why, Confidence, Evidence, Trade-offs).

OUTPUT SCHEMA (Strict JSON):
{
  "qualityScore": {
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
  },
  "mermaidDiagram": string (a valid Mermaid 'graph TD' diagram custom-fitted to '${industry}'),
  "foundation": { "problemStatement": string, "solutionStatement": string, "targetICP": string },
  "market": { "competitors": Array<{ name: string, strength: string, weakness: string }>, "marketGaps": string, "investorNotes": string },
  "features": { "mvpFeatures": string[], "futureFeatures": string[], "monetization": string },
  "tech": { "techStack": { "frontend": string, "backend": string, "database": string, "ai": string }, "riskAnalysis": Array<{ risk: string, mitigation: string }> },
  "database": { "collections": Array<{ name: string, fields: string }>, "endpoints": Array<{ method: string, path: string, desc: string }> },
  "risks": { "folderTree": string, "developmentPhases": Array<{ phase: string, title: string, effort: string }> }
}`;

  const userContent = `Project Name: ${name}
Idea Description: ${idea}
Problem Statement: ${problem}
Target Users: ${targetUsers}
Industry / Domain: ${industry}
Optional Constraints: ${input.optionalConstraints || "24-30h hackathon MVP scope"}`;

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
      solutionStatement: `${name} provides a domain-specific operating system designed to solve '${problem.substring(0, 100)}' for ${targetUsers}.`,
      targetICP: targetUsers,
    },
    market: {
      competitors: domainCompetitors,
      marketGaps: `Existing solutions in ${industry} lack automated cross-section validation for ${name}.`,
      investorNotes: `${name} captures a critical market gap in ${industry} with scalable ROI and strong unit economics.`,
    },
    features: {
      mvpFeatures: [
        `Core ${name} User Interface & Dashboard`,
        `Automated AI Blueprint Engine for ${industry}`,
        "Domain-Aware System Architecture Visualizer",
        "One-Click Project Starter Kit Bundle Generator",
      ],
      futureFeatures: ["Webhook Integrations", "Automated OAuth Sync"],
      monetization: "Freemium SaaS model with $19/mo Pro tier.",
    },
    tech: {
      techStack: {
        frontend: "Next.js 14 (App Router), TypeScript, Tailwind CSS",
        backend: "Next.js Server API Routes, Firebase Admin SDK",
        database: "Firebase Firestore",
        ai: "Gemini 1.5 Pro / OpenAI Engine",
      },
      riskAnalysis: [
        { risk: "API rate limits on external services", mitigation: "Caching and read-only token authorization" },
        { risk: "Domain data isolation", mitigation: "Strict workspace scoping" },
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

  let aiData = await generateModuleInsight(systemPrompt, userContent, fallbackJSON);

  // Auto-Repair Cross-Section Consistency (Auto-Repair Engine)
  aiData = autoRepairBlueprintConsistency(aiData);

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
