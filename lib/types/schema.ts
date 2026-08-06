import { ContextPackage } from "./blueprint";

export type IssueCategory =
  | "engineering"
  | "ux"
  | "performance"
  | "accessibility"
  | "business"
  | "product";

export type IssueSeverity = "critical" | "high" | "medium" | "low";

export interface Issue {
  id: string;
  category: IssueCategory;
  severity: IssueSeverity;
  title: string;
  description: string;
  fixText: string; // "Copy Fix" content
}

export interface RoadmapItem {
  priority: IssueSeverity;
  title: string;
  estimatedEffort: string; // e.g. "15 min", "1-2 hrs"
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: string; // ISO date string
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  websiteUrl: string | null;
  githubRepoUrl: string | null;
  pitchDeckUrl: string | null;
  screenshotUrls: string[];
  blueprintId?: string | null;
  contextPackage?: ContextPackage | null;
  healthScore?: number; // Project Health Progress (0-100%)
  createdAt: string;
  lastValidatedAt: string | null;
  latestScore: number | null;
}

export type RunStatus = "pending" | "running" | "completed" | "failed";

export type ModuleStatusType = "completed" | "skipped" | "failed";

export interface ModuleStatusDetail {
  status: ModuleStatusType;
  reason?: string;
}

export interface ModuleScores {
  productUnderstanding: number | null;
  engineering: number | null;
  ux: number | null;
  performance: number | null;
  accessibility: number | null;
  business: number | null;
}

export interface ModuleStatuses {
  productUnderstanding: ModuleStatusDetail;
  engineering: ModuleStatusDetail;
  ux: ModuleStatusDetail;
  performance: ModuleStatusDetail;
  accessibility: ModuleStatusDetail;
  business: ModuleStatusDetail;
}

export interface ValidationRun {
  id: string;
  projectId: string;
  userId: string;
  status: RunStatus;
  currentModule: string | null;
  overallScore: number | null;
  moduleScores: ModuleScores;
  moduleStatus: ModuleStatuses;
  issues: Issue[];
  roadmap: RoadmapItem[];
  createdAt: string;
  completedAt: string | null;
}
