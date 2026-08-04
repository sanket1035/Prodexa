import { NextRequest, NextResponse } from "next/server";
import { generateAIBlueprint } from "@/lib/modules/blueprint-generator";
import { createBlueprint } from "@/lib/firebase/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, idea, problem, targetUsers, userId = "demo-user-123", optionalIndustry, optionalConstraints } = body;

    if (!name || !idea || !problem) {
      return NextResponse.json(
        { success: false, message: "Project Name, Idea, and Problem Statement are required." },
        { status: 400 }
      );
    }

    const generatedBp = await generateAIBlueprint({
      userId,
      name,
      idea,
      problem,
      targetUsers,
      optionalIndustry,
      optionalConstraints,
    });

    const savedBp = await createBlueprint(generatedBp);

    // Update contextPackage blueprintId reference
    savedBp.contextPackage.blueprintId = savedBp.id;

    return NextResponse.json({ success: true, blueprint: savedBp, blueprintId: savedBp.id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "Blueprint generation failed" }, { status: 500 });
  }
}
