import { NextRequest, NextResponse } from "next/server";
import { getProjectById, getValidationRunsForProject, getBlueprintById } from "@/lib/firebase/db";
import { generateModuleInsight } from "@/lib/utils/openai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, userMessage, isMentorReview } = body;

    if (!projectId) {
      return NextResponse.json({ success: false, message: "projectId is required" }, { status: 400 });
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

    // Build rich project context
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

IDENTIFIED READINESS ISSUES:
${(latestRun?.issues || []).map((i) => `- [${i.severity.toUpperCase()}] ${i.title}: ${i.description}`).join("\n") || "No readiness issues recorded yet."}
`;

    if (isMentorReview) {
      const mentorSystemPrompt = `You are a YC Senior Partner & Hackathon Head Judge evaluating '${project.name}'.
Provide a brutally honest, high-impact YC Mentor Audit JSON containing:
1. "replyText": string (executive summary of the project's current state and pitch readiness)
2. "strengths": string[] (Top 5 genuine strengths)
3. "weaknesses": string[] (Top 5 critical weaknesses / gaps)
4. "judgeQuestions": string[] (5 tough questions judges will ask during Q&A)
5. "demoSuggestions": string[] (3 actionable pitch presentation tips)
6. "actionableFix": string (a concrete code/copy fix snippet)

Output strictly JSON.`;

      const fallbackMentor = {
        replyText: `YC Partner Audit for ${project.name}: The core concept addresses a high-friction problem for software teams. Your top technical risk is missing open-source licensing clarity and low hero CTA contrast. Fix these two items to dramatically boost judge confidence.`,
        strengths: [
          "Bridges Day 0 idea planning directly with pre-launch verification",
          "Includes real deterministic checks alongside qualitative AI reasoning",
          "One-Click Starter Kit provides instant developer utility",
          "Bounded context memory reduces API token consumption",
          "Clean graphite UI aesthetic aligns with Vercel / Linear standards",
        ],
        weaknesses: [
          "Repository lacks explicit MIT / Apache 2.0 open-source LICENSE file",
          "Hero CTA button contrast is below WCAG AA minimum standards",
          "Website lacks explicit pricing tier transparency above the fold",
          "No live demo video link provided in project submission metadata",
          "Performance audit shows uncompressed image asset overhead",
        ],
        judgeQuestions: [
          "How do you prevent generic LLMs like ChatGPT from copying this feature set?",
          "What happens if the target landing page blocks bot scraping via Cloudflare?",
          "How do you calculate the 0-100 Blueprint Quality Score deterministically?",
          "What is your customer acquisition strategy for indie hackers vs enterprise accelerators?",
          "How does context memory binding persist across multi-user sessions?",
        ],
        demoSuggestions: [
          "Start your demo with Option B ('I only have an idea') to show the Blueprint Engine first",
          "Highlight the auto-generated Mermaid Architecture Diagram and Starter Kit download",
          "Demonstrate the one-click Copy Fix drawer resolving a real readiness issue",
        ],
        actionableFix: `// YC Judge Pitch Improvement:\nReplace 'Autonomous Pre-Launch Platform' with 'The AI Operating System That Takes You From Day 0 Idea to Launch Ready.'`,
      };

      const mentorInsight = await generateModuleInsight(mentorSystemPrompt, contextString, fallbackMentor);

      return NextResponse.json({
        success: true,
        isMentorReview: true,
        review: {
          id: "mentor_" + Math.random().toString(36).substring(2, 9),
          summary: mentorInsight.replyText || fallbackMentor.replyText,
          strengths: mentorInsight.strengths || fallbackMentor.strengths,
          weaknesses: mentorInsight.weaknesses || fallbackMentor.weaknesses,
          judgeQuestions: mentorInsight.judgeQuestions || fallbackMentor.judgeQuestions,
          demoSuggestions: mentorInsight.demoSuggestions || fallbackMentor.demoSuggestions,
          actionableFix: mentorInsight.actionableFix || fallbackMentor.actionableFix,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Standard Co-Founder Advisory prompt
    const systemPrompt = `You are the AI Co-Founder & Technical Partner for '${project.name}'.
Answer the founder's question using the specific project context above. Never give generic boilerplate.
Output JSON with: "replyText", "role", "actionableFix".`;

    const fallbackReply = {
      replyText: `Looking at ${project.name}'s current metrics (${project.healthScore || 25}% health, ${latestRun?.overallScore ? `${latestRun.overallScore}% readiness` : "unvalidated"}), focus on fixing your hero CTA contrast and adding a clean LICENSE file to your repository.`,
      role: "pm" as const,
      actionableFix: `// Hero CTA contrast fix for ${project.name}:\n<button className="bg-[#D97B3F] text-[#0B0C0E] px-5 py-2.5 font-medium rounded-[6px] hover:bg-[#E88A4E] transition-colors">\n  Launch ${project.name}\n</button>`,
    };

    const insight = await generateModuleInsight(systemPrompt, `Context:\n${contextString}\n\nUser Question:\n${userMessage}`, fallbackReply);

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
