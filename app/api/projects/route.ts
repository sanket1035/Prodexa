import { NextRequest, NextResponse } from "next/server";
import { newProjectSchema } from "@/lib/utils/validation";
import { createProject, getProjectsForUser } from "@/lib/firebase/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = newProjectSchema.parse(body);

    const userId = body.userId || "demo-user-123";

    let name = validated.name;
    if (!name || name.trim() === "") {
      try {
        const parsedUrl = new URL(validated.websiteUrl);
        name = parsedUrl.hostname.replace("www.", "").split(".")[0];
        name = name.charAt(0).toUpperCase() + name.slice(1);
      } catch {
        name = "New Product";
      }
    }

    const newProj = await createProject({
      userId,
      name,
      websiteUrl: validated.websiteUrl,
      githubRepoUrl: validated.githubRepoUrl || null,
      pitchDeckUrl: validated.pitchDeckUrl || null,
      screenshotUrls: validated.screenshotUrls || [],
    });

    return NextResponse.json({ success: true, project: newProj }, { status: 201 });
  } catch (error: unknown) {
    const err = error as { name?: string; errors?: unknown; message?: string };
    if (err?.name === "ZodError") {
      console.error("[POST /api/projects] Zod Validation Error:", JSON.stringify(err.errors));
      return NextResponse.json(
        { success: false, errors: err.errors, message: "Invalid project parameters" },
        { status: 400 }
      );
    }
    console.error("[POST /api/projects] Server Error:", err.message);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to create project" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || "demo-user-123";

  try {
    const projects = await getProjectsForUser(userId);
    return NextResponse.json({ success: true, projects });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
