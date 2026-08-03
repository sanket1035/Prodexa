import { NextRequest, NextResponse } from "next/server";
import { getProjectById, createValidationRun, updateValidationRun } from "@/lib/firebase/db";
import { runEngineeringAnalysis } from "@/lib/modules/engineering-analysis";
import { runProductUnderstanding } from "@/lib/modules/product-understanding";
import { runUxValidation } from "@/lib/modules/ux-validation";
import { runPerformanceAudit } from "@/lib/modules/performance-audit";
import { runBusinessReview } from "@/lib/modules/business-review";
import { runLaunchPlanner } from "@/lib/modules/launch-planner";
import { Issue, Project } from "@/lib/types/schema";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, userId = "demo-user-123", pitchDeckText } = body;

    if (!projectId) {
      return NextResponse.json({ success: false, message: "projectId is required" }, { status: 400 });
    }

    const project = await getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 });
    }

    const newRun = await createValidationRun({
      projectId,
      userId,
      status: "running",
      currentModule: "Engineering Analysis",
      overallScore: null,
      moduleScores: {
        productUnderstanding: null,
        engineering: null,
        ux: null,
        performance: null,
        accessibility: null,
        business: null,
      },
      moduleStatus: {
        productUnderstanding: { status: "skipped" },
        engineering: { status: "skipped" },
        ux: { status: "skipped" },
        performance: { status: "skipped" },
        accessibility: { status: "skipped" },
        business: { status: "skipped" },
      },
      issues: [],
      roadmap: [],
      completedAt: null,
    });

    executePipelineAsync(newRun.id, project, pitchDeckText);

    return NextResponse.json({ success: true, runId: newRun.id, status: "running" });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

async function executePipelineAsync(runId: string, project: Project, pitchDeckText?: string) {
  const allIssues: Issue[] = [];
  const moduleScores = {
    productUnderstanding: null as number | null,
    engineering: null as number | null,
    ux: null as number | null,
    performance: null as number | null,
    accessibility: null as number | null,
    business: null as number | null,
  };

  const moduleStatusMap: Record<string, { status: "completed" | "skipped" | "failed"; reason?: string }> = {
    productUnderstanding: { status: "skipped" },
    engineering: { status: "skipped" },
    ux: { status: "skipped" },
    performance: { status: "skipped" },
    accessibility: { status: "skipped" },
    business: { status: "skipped" },
  };

  try {
    await updateValidationRun(runId, { currentModule: "Engineering Analysis" });
    const engResult = await runEngineeringAnalysis(project.githubRepoUrl);
    moduleScores.engineering = engResult.score;
    moduleStatusMap.engineering = { status: engResult.status, reason: engResult.reason };
    allIssues.push(...engResult.issues);

    await updateValidationRun(runId, { currentModule: "Product Understanding" });
    const prodResult = await runProductUnderstanding(project.websiteUrl);
    moduleScores.productUnderstanding = prodResult.score;
    moduleStatusMap.productUnderstanding = { status: prodResult.status, reason: prodResult.reason };
    allIssues.push(...prodResult.issues);

    await updateValidationRun(runId, { currentModule: "UX Validation" });
    const uxResult = await runUxValidation(project.websiteUrl);
    moduleScores.ux = uxResult.score;
    moduleScores.accessibility = uxResult.score ? Math.max(50, uxResult.score - 5) : null;
    moduleStatusMap.ux = { status: uxResult.status, reason: uxResult.reason };
    moduleStatusMap.accessibility = { status: uxResult.status };
    allIssues.push(...uxResult.issues);

    await updateValidationRun(runId, { currentModule: "Performance Audit" });
    const perfResult = await runPerformanceAudit(project.websiteUrl);
    moduleScores.performance = perfResult.score;
    moduleStatusMap.performance = { status: perfResult.status, reason: perfResult.reason };
    allIssues.push(...perfResult.issues);

    await updateValidationRun(runId, { currentModule: "Business Review" });
    const bizResult = await runBusinessReview(project.websiteUrl, pitchDeckText);
    moduleScores.business = bizResult.score;
    moduleStatusMap.business = { status: bizResult.status, reason: bizResult.reason };
    allIssues.push(...bizResult.issues);

    await updateValidationRun(runId, { currentModule: "Launch Planner" });
    const launchResult = runLaunchPlanner(moduleScores, allIssues);

    const completedAt = new Date().toISOString();

    await updateValidationRun(runId, {
      status: "completed",
      currentModule: null,
      overallScore: launchResult.overallScore,
      moduleScores,
      moduleStatus: moduleStatusMap as unknown as any,
      issues: allIssues,
      roadmap: launchResult.roadmap,
      completedAt,
    });
  } catch (err: unknown) {
    console.error("Pipeline execution error:", err);
    await updateValidationRun(runId, {
      status: "failed",
      currentModule: null,
    });
  }
}
