import { Issue, RoadmapItem } from "@/lib/types/schema";

export interface LaunchPlannerResult {
  status: "completed";
  score: number;
  overallScore: number;
  roadmap: RoadmapItem[];
}

export function runLaunchPlanner(
  moduleScores: {
    productUnderstanding: number | null;
    engineering: number | null;
    ux: number | null;
    performance: number | null;
    accessibility: number | null;
    business: number | null;
  },
  allIssues: Issue[]
): LaunchPlannerResult {
  // Calculate Overall Weighted Score from completed modules
  const validScores: number[] = [];
  if (moduleScores.productUnderstanding !== null) validScores.push(moduleScores.productUnderstanding);
  if (moduleScores.engineering !== null) validScores.push(moduleScores.engineering);
  if (moduleScores.ux !== null) validScores.push(moduleScores.ux);
  if (moduleScores.performance !== null) validScores.push(moduleScores.performance);
  if (moduleScores.business !== null) validScores.push(moduleScores.business);

  const overallScore = validScores.length > 0
    ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
    : 70;

  // Build prioritized roadmap from identified issues
  const priorityOrder: Record<string, number> = { critical: 1, high: 2, medium: 3, low: 4 };

  const sortedIssues = [...allIssues].sort((a, b) => {
    return (priorityOrder[a.severity] || 5) - (priorityOrder[b.severity] || 5);
  });

  const effortMap: Record<string, string> = {
    critical: "10-15 min",
    high: "15-30 min",
    medium: "30-45 min",
    low: "5-10 min",
  };

  const roadmap: RoadmapItem[] = sortedIssues.map((issue) => ({
    priority: issue.severity,
    title: issue.title,
    estimatedEffort: effortMap[issue.severity] || "15 min",
  }));

  // Fallback defaults if zero issues found
  if (roadmap.length === 0) {
    roadmap.push(
      { priority: "low", title: "Conduct final pre-launch live demo rehearsal", estimatedEffort: "15 min" },
      { priority: "low", title: "Verify OpenGraph social card share preview", estimatedEffort: "5 min" }
    );
  }

  return {
    status: "completed",
    score: overallScore,
    overallScore,
    roadmap,
  };
}
