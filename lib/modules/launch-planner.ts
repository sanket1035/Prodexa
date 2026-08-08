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

  // Build prioritized phased roadmap from identified issues (Week 1 -> Week 2 -> Month 1 -> Month 3)
  const priorityOrder: Record<string, number> = { critical: 1, high: 2, medium: 3, low: 4 };

  const sortedIssues = [...allIssues].sort((a, b) => {
    return (priorityOrder[a.severity] || 5) - (priorityOrder[b.severity] || 5);
  });

  const timeframeMap: Record<string, string> = {
    critical: "Week 1 (Immediate Launch Blocker)",
    high: "Week 2 (High Priority Fix)",
    medium: "Month 1 (Optimization Loop)",
    low: "Month 3 (Scale & Hardening)",
  };

  const roadmap: RoadmapItem[] = sortedIssues.map((issue) => ({
    priority: issue.severity,
    title: issue.title,
    estimatedEffort: timeframeMap[issue.severity] || "Week 1 (Immediate)",
  }));

  // Fallback defaults if zero issues found
  if (roadmap.length === 0) {
    roadmap.push(
      { priority: "low", title: "Conduct final pre-launch live demo rehearsal", estimatedEffort: "Week 1 (Immediate)" },
      { priority: "low", title: "Verify OpenGraph social card share preview", estimatedEffort: "Week 2 (Pre-Launch)" },
      { priority: "low", title: "Setup user feedback widget & analytics tracking", estimatedEffort: "Month 1 (Growth)" }
    );
  }

  return {
    status: "completed",
    score: overallScore,
    overallScore,
    roadmap,
  };
}
