import { NextRequest, NextResponse } from "next/server";
import { getValidationRunById } from "@/lib/firebase/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { runId: string } }
) {
  try {
    const { runId } = params;
    const run = await getValidationRunById(runId);

    if (!run) {
      return NextResponse.json({ success: false, message: "Validation run not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, run });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
