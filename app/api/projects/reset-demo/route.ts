import { NextResponse } from "next/server";
import { resetDemoWorkspace } from "@/lib/firebase/db";

export async function POST() {
  try {
    await resetDemoWorkspace();
    return NextResponse.json({ success: true, message: "Demo workspace reset successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "Failed to reset demo workspace" }, { status: 500 });
  }
}
