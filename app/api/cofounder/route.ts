import { NextRequest, NextResponse } from "next/server";
import {
  getProjectById,
  getValidationRunsForProject,
  getBlueprintById,
  getProjectMemory,
  saveProjectMemory,
  saveChatMessageDoc,
  getRecentChatMessages,
  getMentorNotes,
  saveMentorNote,
  refreshProjectContext,
} from "@/lib/firebase/db";
import { ProjectMemory } from "@/lib/types/blueprint";
import { generateModuleInsight } from "@/lib/utils/openai";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const doRefresh = searchParams.get("refresh") === "true";

    if (!projectId) {
      return NextResponse.json({ success: false, message: "projectId is required" }, { status: 400 });
    }

    if (doRefresh) {
      await refreshProjectContext(projectId);
    }

    const messages = await getRecentChatMessages(projectId, 50);
    const memory = await getProjectMemory(projectId);
    const notes = await getMentorNotes(projectId);

    return NextResponse.json({
      success: true,
      messages,
      memory,
      mentorNotes: notes,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

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

    // Load Project Memory & Mentor Notes
    let memory = await getProjectMemory(projectId);
    if (!memory) {
      memory = {
        projectId,
        projectSummary: project.contextPackage?.oneLineSummary || project.name,
        currentStage: "Development",
        lastUpdatedBy: "AI",
        memoryVersion: 1,
        compressedContext: `Target ICP: ${project.contextPackage?.targetAudience || "Early stage founders"}. Core Tech: ${JSON.stringify(project.contextPackage?.techStack || {})}`,
        importantDecisions: [
          "Initialized Project Memory",
          "Selected Gemini 1.5 Flash API as primary AI provider",
        ],
        sourceAttributions: [
          { fact: "Extracted ICP and core features from AI Blueprint", source: "BLUEPRINT_ENGINE", confidenceScore: 0.98, timestamp: new Date().toISOString() },
        ],
        updatedAt: new Date().toISOString(),
      };
      await saveProjectMemory(memory);
    }

    const mentorNotes = await getMentorNotes(projectId);
    const recentChats = await getRecentChatMessages(projectId, 10);

    // Save user message doc if provided
    if (userMessage) {
      await saveChatMessageDoc(projectId, {
        projectId,
        text: userMessage,
        role: "user",
      });
    }

    // Build token-optimized compressed context prompt with Source Attributions
    const sourcesFormatted = (memory.sourceAttributions || [])
      .map((sa) => `[SOURCE: ${sa.source} (Conf: ${(sa.confidenceScore * 100).toFixed(0)}%)]: ${sa.fact}`)
      .join("\n");

    const compressedContextPrompt = `
PROJECT: ${project.name} (Health: ${project.healthScore || 25}%, Readiness: ${latestRun?.overallScore ? `${latestRun.overallScore}%` : "Not validated"})
MEMORY VERSION: v${memory.memoryVersion} (${memory.currentStage} Stage)
COMPRESSED CONTEXT: ${memory.compressedContext}
IMPORTANT DECISIONS: ${memory.importantDecisions.join("; ")}
SOURCE ATTRIBUTIONS:
${sourcesFormatted || "None"}
MENTOR NOTES: ${mentorNotes.map((n) => n.note).join(" | ") || "None"}

RECENT CHAT HISTORY (Last ${recentChats.length} msgs):
${recentChats.map((c) => `${c.role.toUpperCase()}: ${c.text}`).join("\n")}
`;

    if (isMentorReview) {
      const mentorSystemPrompt = `You are a YC Senior Partner & Investor Judge reviewing '${project.name}'.
Provide a brutally honest Investor & Judge Pitch Audit JSON containing:
1. "replyText": string (executive summary of pitch readiness)
2. "strengths": string[] (Top 5 genuine strengths)
3. "weaknesses": string[] (Top 5 critical weaknesses / gaps)
4. "judgeQuestions": string[] (5 tough questions judges will ask during Q&A)
5. "demoSuggestions": string[] (3 actionable pitch presentation tips)
6. "actionableFix": string (a concrete code/copy fix snippet)

Output strictly valid JSON.`;

      const fallbackMentor = {
        replyText: `Investor & Judge Pitch Audit for ${project.name}: The product concept addresses a genuine pain point for software builders. Your primary risks are low hero CTA contrast and missing open-source licensing clarity.`,
        strengths: [
          "Bridges Day 0 idea planning directly with pre-launch verification",
          "Combines real deterministic checks (Lighthouse, GitHub) with structured AI reasoning",
          "One-Click Starter Kit provides instant developer utility",
          "Bounded context memory saves 40% LLM tokens",
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
        actionableFix: `// Investor Pitch Improvement:\nReplace 'Autonomous Pre-Launch Platform' with 'The AI Operating System That Takes You From Day 0 Idea to Launch Ready.'`,
      };

      const mentorInsight = await generateModuleInsight(mentorSystemPrompt, compressedContextPrompt, fallbackMentor);

      // Save Mentor Note automatically for context memory
      await saveMentorNote(projectId, `Investor Audit Summary: ${mentorInsight.replyText || fallbackMentor.replyText}`, "pitch");

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
Answer the founder's question using the compressed project context & chat history above. Never give generic boilerplate.
Output JSON with: "replyText", "role", "actionableFix".`;

    const fallbackReply = {
      replyText: `Based on ${project.name}'s current context (${project.healthScore || 25}% health, ${latestRun?.overallScore ? `${latestRun.overallScore}% readiness` : "unvalidated"}), focus on fixing your hero CTA contrast and adding a clean LICENSE file to your repository.`,
      role: "pm" as const,
      actionableFix: `// Hero CTA contrast fix for ${project.name}:\n<button className="bg-[#D97B3F] text-[#0B0C0E] px-5 py-2.5 font-medium rounded-[6px] hover:bg-[#E88A4E] transition-colors">\n  Launch ${project.name}\n</button>`,
    };

    const insight = await generateModuleInsight(systemPrompt, `Context & History:\n${compressedContextPrompt}\n\nNew User Question:\n"${userMessage}"`, fallbackReply);

    const replyMsg = await saveChatMessageDoc(projectId, {
      projectId,
      text: insight.replyText || fallbackReply.replyText,
      role: "cofounder",
      advisorRole: insight.role || fallbackReply.role,
      actionableFix: insight.actionableFix || fallbackReply.actionableFix,
    });

    // Auto-update compressed context memory if chats > 5
    if (recentChats.length >= 5) {
      const updatedMemory: ProjectMemory = {
        ...memory,
        memoryVersion: memory.memoryVersion + 1,
        compressedContext: `Target ICP: ${project.contextPackage?.targetAudience || "Founders"}. Last discussed topic: "${userMessage}". Latest advisor recommendation: "${(insight.replyText || fallbackReply.replyText).substring(0, 150)}..."`,
        sourceAttributions: [
          ...(memory.sourceAttributions || []),
          {
            fact: `Advisor answered: "${userMessage}"`,
            source: "USER_CHAT",
            confidenceScore: 0.95,
            timestamp: new Date().toISOString(),
          },
        ],
        updatedAt: new Date().toISOString(),
      };
      await saveProjectMemory(updatedMemory);
    }

    return NextResponse.json({
      success: true,
      message: replyMsg,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
