export type BlueprintCategory =
  | "foundation"
  | "market"
  | "features"
  | "tech"
  | "database"
  | "risks";

export interface MetricDetail {
  value: number;
  reason: string;
  confidence: number;
  formulaBreakdown?: string;
  sourceLabel?: string;
}

export interface BlueprintQualityScore {
  overall: number; // 0-100
  metrics: {
    innovation: number;
    businessPotential: number;
    technicalFeasibility: number;
    scalability: number;
    aiNecessity: number;
    marketReadiness: number;
  };
  metricDetails?: {
    technicalFeasibility: MetricDetail;
    businessPotential: MetricDetail;
    innovation: MetricDetail;
    scalability: MetricDetail;
    marketReadiness: MetricDetail;
    aiNecessity: MetricDetail;
  };
  strengths: string[];
  weaknesses: string[];
  rationale: string;
}

export interface ContextPackage {
  blueprintId: string;
  projectName: string;
  oneLineSummary: string;
  problemStatement: string;
  targetAudience: string;
  coreFeatures: string[];
  techStack: {
    frontend: string;
    backend: string;
    database: string;
    ai: string;
  };
  keyCompetitors: string[];
  generatedAt: string;
}

export interface ImportantDecision {
  id: string;
  decision: string;
  timestamp: string;
}

export interface SourceAttribution {
  fact: string;
  source: "BLUEPRINT_ENGINE" | "GITHUB_AUDIT" | "MENTOR_NOTE" | "USER_CHAT";
  confidenceScore: number;
  timestamp: string;
}

export interface ProjectMemorySnapshot {
  version: number;
  compressedContext: string;
  importantDecisions: string[];
  updatedAt: string;
}

export interface ProjectMemory {
  projectId: string;
  projectSummary: string;
  currentStage: "Blueprint" | "Development" | "AuditReady" | "InvestorReady";
  lastUpdatedBy: "AI" | "Mentor" | "User";
  memoryVersion: number;
  compressedContext: string;
  importantDecisions: string[];
  sourceAttributions: SourceAttribution[];
  updatedAt: string;
}

export interface MentorNote {
  id: string;
  projectId: string;
  note: string;
  category: "pitch" | "engineering" | "ux" | "business";
  createdAt: string;
}

export interface ChatMessageDoc {
  id: string;
  projectId: string;
  text: string;
  role: "user" | "cofounder";
  advisorRole?: "advisor" | "pm" | "architect" | "judge";
  actionableFix?: string;
  createdAt: string;
}

export interface BlueprintSection {
  id: string;
  title: string;
  category: BlueprintCategory;
  content: any;
  status: "accepted" | "modified" | "draft";
}

export interface Blueprint {
  id: string;
  userId: string;
  name: string;
  idea: string;
  problem: string;
  targetUsers?: string;
  optionalIndustry?: string;
  optionalConstraints?: string;
  qualityScore: BlueprintQualityScore;
  mermaidDiagram: string;
  sections: BlueprintSection[];
  contextPackage: ContextPackage;
  createdAt: string;
  status: "draft" | "accepted";
}
