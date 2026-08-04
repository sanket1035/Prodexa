import { NextRequest, NextResponse } from "next/server";
import { getProjectById, getValidationRunsForProject, getBlueprintById } from "@/lib/firebase/db";
import { generateModuleInsight } from "@/lib/utils/openai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, userMessage } = body;

    if (!projectId || !userMessage) {
      return NextResponse.json({ success: false, message: "projectId and userMessage are required" }, { status: 400 });
    }

    const project = await getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 });
    }

    const runs = await getValidationRunsForProject(projectId);
    const latestRun = runs.length > 0 ? runs[0] : null;

    let blueprint = null;
    if (project.blueprintId) {
      blueprint = await getBlueprintById(project.blueprintId);
    }

    // Build project context string for LLM
    const contextString = `
PROJECT NAME: ${project.name}
WEBSITE URL: ${project.websiteUrl}
GITHUB REPO URL: ${project.githubRepoUrl || "Not connected yet"}
HEALTH PROGRESS SCORE: ${project.healthScore || 25}%
READINESS SCORE: ${latestRun?.overallScore !== null && latestRun?.overallScore !== undefined ? `${latestRun.overallScore}%` : "Not validated yet"}

BLUEPRINT CONTEXT:
- Problem: ${blueprint?.problem || project.contextPackage?.problemStatement || "N/A"}
- Target ICP: ${blueprint?.targetUsers || project.contextPackage?.targetAudience || "N/A"}
- Tech Stack: ${JSON.stringify(blueprint?.contextPackage?.techStack || project.contextPackage?.techStack || {})}
- Core Features: ${(blueprint?.contextPackage?.coreFeatures || project.contextPackage?.coreFeatures || []).join(", ")}

IDENTIFIED CRITICAL GAPS / ISSUES:
${(latestRun?.issues || []).map((i) => `- [${i.severity.toUpperCase()}] ${i.title}: ${i.description}`).join("\n") || "No readiness issues recorded yet."}
`;

    const systemPrompt = `You are the AI Co-Founder & Technical Partner for the software project '${project.name}'. 
Your persona is a mix of YC Startup Mentor, Principal Technical Architect, and Hackathon Judge.
You have FULL access to the project's exact blueprint, landing page audit, GitHub metadata, launch readiness score, and identified gaps.

CRITICAL INSTRUCTIONS:
1. NEVER give generic boilerplate advice (e.g. 'Improve UX'). Always give project-specific, actionable recommendations referencing the actual data above.
2. Be direct, authoritative, and helpful.
3. Output a structured JSON object with keys:
   - "replyText": string (the detailed, project-specific advisory text)
   - "role": "advisor" | "pm" | "architect" | "judge"
   - "actionableFix": string (optional code snippet or concrete action step)

Output strictly valid JSON.`;

    const userPrompt = `Project Context Data:
${contextString}

Founder's Question:
"${userMessage}"`;

    const fallbackReply = {
      replyText: `Looking at ${project.name}'s current setup (${project.healthScore || 25}% health, ${latestRun?.overallScore ? `${latestRun.overallScore}% readiness` : "unvalidated"}), your top priority is resolving the primary CTA contrast and adding a clear open-source LICENSE to your repository. Hackathon judges will look for legal clarity and instant demo CTA visibility above the fold.`,
      role: "pm" as const,
      actionableFix: `// Recommended Hero CTA contrast fix for ${project.name}:\n<button className="bg-[#D97B3F] text-[#0B0C0E] px-5 py-2.5 font-medium rounded-[6px] hover:bg-[#E88A4E] transition-colors">\n  Launch ${project.name}\n</button>`,
    };

    const insight = await generateModuleInsight(systemPrompt, userPrompt, fallbackReply);

    return NextResponse.json({
      success: true,
      message: {
        id: "msg_" + Math.random().toString(36).substring(2, 9),
        sender: "cofounder",
        text: insight.replyText || fallbackReply.replyText,
        role: insight.role || fallbackReply.role,
        actionableFix: insight.actionableFix || fallbackReply.actionableFix,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
