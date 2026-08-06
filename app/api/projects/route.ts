import { NextRequest, NextResponse } from "next/server";
import { newProjectSchema } from "@/lib/utils/validation";
import { createProject, getProjectsForUser, deleteProject } from "@/lib/firebase/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = newProjectSchema.parse(body);

    const userId = body.userId || "demo-user-123";

    let realWebsiteUrl: string | null = validated.websiteUrl || null;
    let realGithubUrl: string | null = validated.githubRepoUrl || null;

    // If GitHub URL was pasted into websiteUrl input, sanitize and separate them
    if (realWebsiteUrl && realWebsiteUrl.includes("github.com")) {
      if (!realGithubUrl) realGithubUrl = realWebsiteUrl;
      realWebsiteUrl = null;
    }

    let name = validated.name;
    if (!name || name.trim() === "") {
      if (realWebsiteUrl) {
        try {
          const parsedUrl = new URL(realWebsiteUrl);
          name = parsedUrl.hostname.replace("www.", "").split(".")[0];
          name = name.charAt(0).toUpperCase() + name.slice(1);
        } catch {
          name = "New Product";
        }
      } else if (realGithubUrl) {
        const parts = realGithubUrl.replace(/\/$/, "").split("/");
        name = parts[parts.length - 1] || "New Product";
      } else {
        name = "New Product";
      }
    }

    const newProj = await createProject({
      userId,
      name,
      websiteUrl: realWebsiteUrl,
      githubRepoUrl: realGithubUrl,
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

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ success: false, message: "Project id is required" }, { status: 400 });
  }

  try {
    await deleteProject(id);
    return NextResponse.json({ success: true, id });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
