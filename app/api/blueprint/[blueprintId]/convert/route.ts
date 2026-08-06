import { NextRequest, NextResponse } from "next/server";
import { convertBlueprintToProject } from "@/lib/firebase/db";

export async function POST(
  req: NextRequest,
  { params }: { params: { blueprintId: string } }
) {
  try {
    const { blueprintId } = params;
    let userId: string | undefined = undefined;
    try {
      const body = await req.json();
      if (body?.userId) userId = body.userId;
    } catch {
      // JSON body optional
    }

    const project = await convertBlueprintToProject(blueprintId, userId);

    if (!project) {
      return NextResponse.json({ success: false, message: "Blueprint not found or conversion failed" }, { status: 404 });
    }

    return NextResponse.json({ success: true, project, projectId: project.id });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
