import { NextRequest, NextResponse } from "next/server";
import { updateBlueprintSection, getBlueprintById } from "@/lib/firebase/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { blueprintId: string } }
) {
  try {
    const { blueprintId } = params;
    const body = await req.json();
    const { sectionId, content } = body;

    if (!sectionId || !content) {
      return NextResponse.json({ success: false, message: "sectionId and content are required" }, { status: 400 });
    }

    const updated = await updateBlueprintSection(blueprintId, sectionId, content);
    if (!updated) {
      return NextResponse.json({ success: false, message: "Blueprint not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, blueprint: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { blueprintId: string } }
) {
  try {
    const { blueprintId } = params;
    const blueprint = await getBlueprintById(blueprintId);

    if (!blueprint) {
      return NextResponse.json({ success: false, message: "Blueprint not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, blueprint });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
