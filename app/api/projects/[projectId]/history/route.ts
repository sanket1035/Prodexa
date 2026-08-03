import { NextRequest, NextResponse } from "next/server";
import { getValidationRunsForProject } from "@/lib/firebase/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    const runs = await getValidationRunsForProject(projectId);
    return NextResponse.json({ success: true, runs });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
