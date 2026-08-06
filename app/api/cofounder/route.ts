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
  demoProjectId,
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

    // Load Project Memory & Mentor Notes dynamically for project
    let memory = await getProjectMemory(projectId);
    const realTech = project.contextPackage?.techStack || { frontend: "Next.js 14, TypeScript", backend: "Server API Routes", database: "PostgreSQL / Firestore" };
    const realSummary = project.contextPackage?.oneLineSummary || `Platform for ${project.name}`;
    const realAudience = project.contextPackage?.targetAudience || "target users & developers";

    if (!memory || (memory.projectId === demoProjectId && projectId !== demoProjectId)) {
      memory = {
        projectId,
        projectSummary: realSummary,
        currentStage: "Development",
        lastUpdatedBy: "AI",
        memoryVersion: 1,
        compressedContext: `${project.name} is a software product designed for ${realAudience}. Website: ${project.websiteUrl || "Not specified"}, GitHub: ${project.githubRepoUrl || "Not specified"}. Tech stack: ${JSON.stringify(realTech)}.`,
        importantDecisions: [
          `Initialized Project Context Memory for ${project.name}`,
          `Configured modern production web architecture with Next.js & TypeScript`,
          `Set target ICP positioning for ${realAudience}`,
        ],
        sourceAttributions: [
          { fact: `Extracted ICP and product vision for ${project.name}`, source: "BLUEPRINT_ENGINE", confidenceScore: 0.98, timestamp: new Date().toISOString() },
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
TARGET PRODUCT UNDER REVIEW: '${project.name}'
WEBSITE URL: ${project.websiteUrl || "Not specified"}
GITHUB REPOSITORY: ${project.githubRepoUrl || "Not specified"}
HEALTH SCORE: ${project.healthScore || 25}%
READINESS AUDIT SCORE: ${latestRun?.overallScore ? `${latestRun.overallScore}%` : "Not validated"}

PRODUCT SUMMARY: ${project.contextPackage?.oneLineSummary || project.name}
TARGET AUDIENCE: ${project.contextPackage?.targetAudience || "Target users"}
TECH STACK: ${JSON.stringify(project.contextPackage?.techStack || { frontend: "Next.js", backend: "API" })}

COMPRESSED CONTEXT: ${memory.compressedContext}
IMPORTANT DECISIONS: ${memory.importantDecisions.join("; ")}
SOURCE ATTRIBUTIONS:
${sourcesFormatted || "None"}
MENTOR NOTES: ${mentorNotes.map((n) => n.note).join(" | ") || "None"}

CRITICAL MANDATE FOR AI: All feedback, pitch review summary, strengths, weaknesses, questions, and actionable code fixes MUST be 100% SPECIFIC to '${project.name}'. Do NOT mention Gemini 1.5 Flash API or Prodexa unless the project under review is explicitly Prodexa.

RECENT CHAT HISTORY (Last ${recentChats.length} msgs):
${recentChats.map((c) => `${c.role.toUpperCase()}: ${c.text}`).join("\n")}
`;

    if (isMentorReview) {
      const mentorSystemPrompt = `You are a YC Senior Partner & Investor Judge reviewing '${project.name}'.
Provide a brutally honest Investor & Judge Pitch Audit JSON containing:
1. "replyText": string (executive summary of pitch readiness for '${project.name}')
2. "strengths": string[] (Top 5 genuine strengths for '${project.name}')
3. "weaknesses": string[] (Top 5 critical weaknesses / gaps for '${project.name}')
4. "judgeQuestions": string[] (5 tough questions judges will ask during Q&A for '${project.name}')
5. "demoSuggestions": string[] (3 actionable pitch presentation tips for '${project.name}')
6. "actionableFix": string (a concrete code/copy fix snippet for '${project.name}')

Output strictly valid JSON.`;

      const targetAudience = project.contextPackage?.targetAudience || "target users";
      const realIssues = latestRun?.issues || [];
      const hasRepo = Boolean(project.githubRepoUrl && !project.githubRepoUrl.includes("example.com"));
      const hasWeb = Boolean(project.websiteUrl && !project.websiteUrl.includes("example.com"));

      const fallbackMentor = {
        replyText: `Investor & Judge Pitch Review for '${project.name}': The project ${hasWeb ? `is live at ${project.websiteUrl}` : "has no live landing page connected"} and ${hasRepo ? `has repository ${project.githubRepoUrl}` : "has no GitHub repository connected"}. Current Launch Readiness Score is ${latestRun?.overallScore ?? "unvalidated"}%. ${realIssues.length > 0 ? `Identified ${realIssues.length} issues that require attention.` : "All readiness checks passed cleanly."}`,
        strengths: [
          `Product concept '${project.name}' targets ${targetAudience}`,
          hasWeb ? `Deployed web application accessible at ${project.websiteUrl}` : `Clear project concept and scope`,
          hasRepo ? `Open-source codebase hosted on GitHub (${project.githubRepoUrl})` : `Structured MVP feature specification`,
          `Health Score of ${project.healthScore || 25}% indicating active development`,
          `Defined tech stack: ${JSON.stringify(project.contextPackage?.techStack || { frontend: "Next.js" })}`,
        ],
        weaknesses: realIssues.length > 0 ? realIssues.map((i) => `${i.title}: ${i.description.substring(0, 100)}`) : [
          !hasWeb ? "No deployed website URL connected for live inspection" : "Requires performance asset optimization",
          !hasRepo ? "No GitHub repository connected for code quality auditing" : "Requires additional test coverage",
          "Needs explicit pricing tier transparency above the fold",
          "No demo video walk-through attached to submission",
        ],
        judgeQuestions: [
          `What is the primary value proposition of '${project.name}' compared to existing solutions?`,
          `How do you plan to acquire your first 100 users for ${targetAudience}?`,
          `What is your tech stack strategy for scaling '${project.name}'?`,
          !hasWeb ? `When will the live deployed version of '${project.name}' be publicly accessible?` : `How do you handle user retention on ${project.websiteUrl}?`,
          !hasRepo ? `Is '${project.name}' open source or proprietary? Where is the codebase hosted?` : `What license governs '${project.name}' repository?`,
        ],
        demoSuggestions: [
          `Start your presentation by showing '${project.name}' solving a real problem in 30 seconds`,
          `Demonstrate the core workflow live rather than using static slides`,
          `Highlight your target user traction and clear deployment roadmap`,
        ],
        actionableFix: `// Value Proposition for ${project.name}:\n"The Ultimate Platform Built Specifically for ${targetAudience}."`,
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

    // Standard Co-Founder Advisory prompt — detailed context forces question-specific answers
    const systemPrompt = `You are the AI Co-Founder & Technical Partner for '${project.name}'.

CRITICAL: You MUST answer the SPECIFIC question asked. Do NOT give a generic response.
The founder's question is: "${userMessage}"

Use the full project context provided (blueprint, health score, readiness score, tech stack, decisions, mentor notes, and chat history) to give a SPECIFIC, ACTIONABLE answer to THIS exact question for '${project.name}'.

Rules:
- If asked about judges: list specific hackathon judge criticisms for '${project.name}'
- If asked about landing page: give specific UI/UX improvements for '${project.name}'
- If asked about critical gaps: identify the SINGLE most critical gap from the audit results of '${project.name}'
- If asked about score: explain exactly what is dragging '${project.name}''s score down and how to fix it
- Never repeat a previous answer from chat history
- Be direct, specific, and technical

Output JSON: { "replyText": string (200-400 words, specific to the question), "role": "advisor"|"pm"|"engineer", "actionableFix": string (copy-pasteable code or action) }`;

    // Question-aware deterministic fallback (different answer per question type)
    const q = (userMessage || "").toLowerCase();
    const realIssues = latestRun?.issues || [];
    const topIssue = realIssues.length > 0 ? realIssues[0] : null;

    let fallbackReply: { replyText: string; role: "pm" | "advisor" | "engineer"; actionableFix: string } = {
      replyText: `For '${project.name}' (Health: ${project.healthScore || 25}%, Readiness: ${latestRun?.overallScore ?? "unvalidated"}%): ${memory.compressedContext || "Review your project context for key gaps."}`,
      role: "pm",
      actionableFix: `// Review project requirements and run a full audit.`,
    };

    if (q.includes("judge") || q.includes("criticize") || q.includes("hackathon")) {
      const techStack = JSON.stringify(project.contextPackage?.techStack || {});
      fallbackReply = {
        replyText: `Top hackathon judge criticisms for '${project.name}':\n\n1. **No deployed live URL attached** — ${project.websiteUrl ? `Currently connected to ${project.websiteUrl}` : "Judges expect a deployed live link"}.\n2. **Repository documentation** — ${project.githubRepoUrl ? `Repository ${project.githubRepoUrl} requires LICENSE file` : "No repository attached for inspection"}.\n3. **Landing page value proposition** — hero headline must clearly explain '${project.name}' to ${project.contextPackage?.targetAudience || "users"} in 5 seconds.\n4. **Tech stack justification** — ${techStack}; judges will ask why this stack was chosen.\n5. **Product differentiation** — judges will ask how '${project.name}' stands out from existing solutions.\n6. **Readiness score ${latestRun?.overallScore ?? "unvalidated"}%** means audit gaps are visible to judges.\n7. **Traction metrics** — even 1-2 beta users or survey responses increase credibility.`,
        role: "advisor" as const,
        actionableFix: `// Add to README for ${project.name}:\n## 🏆 Pitch & Demo Details\n- Live Product: ${project.websiteUrl || "https://your-app.vercel.app"}\n- Tech Stack: Next.js 14, TypeScript\n- Target ICP: ${project.contextPackage?.targetAudience || "Software Builders"}`,
      };
    } else if (q.includes("landing") || q.includes("hero") || q.includes("website")) {
      fallbackReply = {
        replyText: `Landing page recommendations for '${project.name}':\n\n1. **Hero Headline**: Rewrite as: "${project.name} — ${project.contextPackage?.oneLineSummary || "Built for Your Target Audience"}"\n2. **Primary CTA**: Single high-contrast action button above the fold (e.g., "Get Started with ${project.name} →")\n3. **Social Proof**: Show user count, beta feedback, or key feature highlights\n4. **Feature Grid**: Showcase 3 core capabilities built specifically for ${project.contextPackage?.targetAudience || "users"}\n5. **Meta Description**: Add OpenGraph tags so sharing ${project.websiteUrl || project.name} generates rich preview cards\n6. **Mobile Viewport**: Ensure responsive design across mobile screens\n7. **Demo Video**: Add a 30-second product demo GIF or video`,
        role: "pm" as const,
        actionableFix: `// Hero section for ${project.name}:\n<h1>${project.name} — ${project.contextPackage?.oneLineSummary || "Built for Your Target Audience"}</h1>\n<p>For ${project.contextPackage?.targetAudience || "Target Users"}</p>\n<button className="bg-amber-600 text-black px-6 py-3 font-semibold rounded-lg">\n  Get Started with ${project.name} →\n</button>`,
      };
    } else if (q.includes("critical") || q.includes("gap") || q.includes("fix") || q.includes("launch")) {
      fallbackReply = {
        replyText: `Single most critical gap for '${project.name}' before launch:\n\n${topIssue ? `**${topIssue.title}** (${topIssue.severity} severity): ${topIssue.description}\n\nFix: ${topIssue.fixText}` : `**No deployed website URL connected yet.** Connect your live deployed landing page URL so all audit modules can analyze your real product.`}\n\nSecondary gaps: ${realIssues.slice(1, 3).map((i) => i.title).join(", ") || "None detected."}`,
        role: "engineer" as const,
        actionableFix: topIssue?.fixText || `// Connect live website URL for ${project.name} in Assets drawer`,
      };
    } else if (q.includes("score") || q.includes("readiness") || q.includes("improve")) {
      fallbackReply = {
        replyText: `Your '${project.name}' Launch Readiness Score is ${latestRun?.overallScore ?? "unvalidated"}%.\n\nScore breakdown by module:\n- Product Understanding: ${latestRun?.moduleScores?.productUnderstanding ?? "--"}%\n- Engineering Analysis: ${latestRun?.moduleScores?.engineering ?? "Skipped"}%\n- UX Validation: ${latestRun?.moduleScores?.ux ?? "--"}%\n- Performance: ${latestRun?.moduleScores?.performance ?? "--"}%\n- Business Review: ${latestRun?.moduleScores?.business ?? "--"}%\n\nTo increase score fastest: Connect your live deployed website URL and link your GitHub repository.`,
        role: "pm" as const,
        actionableFix: `// Score boost checklist for ${project.name}:\n// 1. Connect live website URL\n// 2. Connect GitHub repository\n// 3. Add OpenGraph meta tags\n// 4. Resolve high-priority audit gaps`,
      };
    }

    const insight = await generateModuleInsight(systemPrompt, `Project Context:\n${compressedContextPrompt}\n\nFounder Question:\n"${userMessage}"\n\nAnswer this SPECIFIC question for '${project.name}'.`, fallbackReply);

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
            fact: `Advisor answered: "${userMessage}" for ${project.name}`,
            source: "USER_CHAT",
            confidenceScore: 0.95,
            timestamp: new Date().toISOString(),
          },
        ],
        updatedAt: new Date().toISOString(),
      };
      await saveProjectMemory(updatedMemory);
    }

    return NextResponse.json({ success: true, message: replyMsg });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
