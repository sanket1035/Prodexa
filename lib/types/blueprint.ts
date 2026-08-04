export type BlueprintCategory =
  | "foundation"
  | "market"
  | "features"
  | "tech"
  | "database"
  | "risks";

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

export interface BlueprintSection {
  id: string;
  title: string;
  category: BlueprintCategory;
  content: any; // Structured JSON per category
  status: "accepted" | "modified" | "draft";
}

export interface Blueprint {
  id: string;
  userId: string;
  name: string;
  idea: string;
  problem: string;
  targetUsers: string;
  qualityScore: BlueprintQualityScore;
  mermaidDiagram: string;
  sections: BlueprintSection[];
  contextPackage: ContextPackage;
  status: "draft" | "accepted";
  createdAt: string;
}
