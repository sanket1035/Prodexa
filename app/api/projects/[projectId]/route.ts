import { NextRequest, NextResponse } from "next/server";
import { getProjectById, deleteProject } from "@/lib/firebase/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    const project = await getProjectById(projectId);

    if (!project) {
      return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    const body = await req.json();
    const { name, websiteUrl, githubRepoUrl, pitchDeckUrl } = body;

    const project = await getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 });
    }

    if (name !== undefined && name.trim() !== "") project.name = name.trim();
    if (websiteUrl !== undefined) project.websiteUrl = websiteUrl;
    if (githubRepoUrl !== undefined) project.githubRepoUrl = githubRepoUrl;
    if (pitchDeckUrl !== undefined) project.pitchDeckUrl = pitchDeckUrl;

    // Recalculate Health Progress Score
    let health = 25; // Blueprint accepted base
    if (project.websiteUrl && !project.websiteUrl.includes("example-landing-page.com")) health += 25; // 50%
    if (project.githubRepoUrl) health += 25; // 75%
    if (project.latestScore !== null && project.latestScore !== undefined) health = 100; // 100%

    project.healthScore = Math.min(100, health);

    try {
      const { adminDb } = await import("@/lib/firebase/admin");
      await adminDb.collection("projects").doc(projectId).update({
        name: project.name,
        websiteUrl: project.websiteUrl,
        githubRepoUrl: project.githubRepoUrl,
        pitchDeckUrl: project.pitchDeckUrl,
        healthScore: project.healthScore,
      });
    } catch {
      // Memory fallback store updated automatically
    }

    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    await deleteProject(projectId);
    return NextResponse.json({ success: true, projectId });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
