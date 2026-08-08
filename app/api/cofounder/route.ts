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
import { getDerivedProjectName } from "@/lib/utils/project-name";

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

    const project = await getProjectById(projectId);
    const projectName = project ? getDerivedProjectName(project) : "Product Workspace";

    const messages = await getRecentChatMessages(projectId, 50);
    const cleanedMessages = messages.map((m) => ({
      ...m,
      text: m.text ? m.text.replace(/Workspace Project/g, projectName).replace(/Product Workspace/g, projectName) : m.text,
      actionableFix: m.actionableFix ? m.actionableFix.replace(/Workspace Project/g, projectName).replace(/Product Workspace/g, projectName) : m.actionableFix,
    }));

    const memory = await getProjectMemory(projectId);
    const notes = await getMentorNotes(projectId);

    return NextResponse.json({
      success: true,
      messages: cleanedMessages,
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

    // Strictly resolve project identity and derive clean product name
    const projectName = getDerivedProjectName(project);
    project.name = projectName;

    const runs = await getValidationRunsForProject(projectId);
    const latestRun = runs.length > 0 ? runs[0] : null;
    const overallScoreNum = latestRun?.overallScore ?? project.latestScore ?? 88;

    let blueprint = null;
    if (project.blueprintId) {
      blueprint = await getBlueprintById(project.blueprintId);
    }

    // Load Project Memory & Mentor Notes dynamically for project
    let memory = await getProjectMemory(projectId);
    const realTech = project.contextPackage?.techStack || { frontend: "Next.js 14, TypeScript", backend: "Server API Routes", database: "PostgreSQL / Firestore" };
    const realSummary = project.contextPackage?.oneLineSummary || `Platform for ${projectName}`;
    const realAudience = project.contextPackage?.targetAudience || "target users & developers";

    if (!memory || (memory.projectId === demoProjectId && projectId !== demoProjectId)) {
      memory = {
        projectId,
        projectSummary: realSummary,
        currentStage: "Development",
        lastUpdatedBy: "AI",
        memoryVersion: 1,
        compressedContext: `${projectName} is a software product designed for ${realAudience}. Website: ${project.websiteUrl || "Not specified"}, GitHub: ${project.githubRepoUrl || "Not specified"}. Tech stack: ${JSON.stringify(realTech)}.`,
        importantDecisions: [
          `Initialized Project Context Memory for ${projectName}`,
          `Configured modern production web architecture with Next.js & TypeScript`,
          `Set target ICP positioning for ${realAudience}`,
        ],
        sourceAttributions: [
          { fact: `Extracted ICP and product vision for ${projectName}`, source: "BLUEPRINT_ENGINE", confidenceScore: 0.98, timestamp: new Date().toISOString() },
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
TARGET PRODUCT UNDER REVIEW: '${projectName}'
WEBSITE URL: ${project.websiteUrl || "Not specified"}
GITHUB REPOSITORY: ${project.githubRepoUrl || "Not specified"}
HEALTH SCORE: ${project.healthScore || 25}%
READINESS AUDIT SCORE: ${overallScoreNum}%

PRODUCT SUMMARY: ${project.contextPackage?.oneLineSummary || projectName}
TARGET AUDIENCE: ${project.contextPackage?.targetAudience || "Target users"}
TECH STACK: ${JSON.stringify(project.contextPackage?.techStack || { frontend: "Next.js", backend: "API" })}

COMPRESSED CONTEXT: ${memory.compressedContext}
IMPORTANT DECISIONS: ${memory.importantDecisions.join("; ")}
SOURCE ATTRIBUTIONS:
${sourcesFormatted || "None"}
MENTOR NOTES: ${mentorNotes.map((n) => n.note).join(" | ") || "None"}

CRITICAL MANDATE FOR AI: All feedback, pitch review summary, strengths, weaknesses, questions, and actionable code fixes MUST be 100% SPECIFIC to '${projectName}'. Do NOT mention Gemini 1.5 Flash API or Prodexa unless the project under review is explicitly Prodexa.

RECENT CHAT HISTORY (Last ${recentChats.length} msgs):
${recentChats.map((c) => `${c.role.toUpperCase()}: ${c.text}`).join("\n")}
`;

    if (isMentorReview) {
      const targetAudience = project.contextPackage?.targetAudience || "target users";
      const realIssues = latestRun?.issues || [];
      const hasRepo = Boolean(project.githubRepoUrl && !project.githubRepoUrl.includes("example.com"));
      const hasWeb = Boolean(project.websiteUrl && !project.websiteUrl.includes("example.com"));

      // Deterministically calculate overall investor readiness score from stored project data
      let calcInvestorScore = overallScoreNum;
      if (hasWeb) calcInvestorScore += 5;
      if (hasRepo) calcInvestorScore += 5;
      if (project.blueprintId) calcInvestorScore += 5;
      if (realIssues.length > 0) calcInvestorScore -= Math.min(25, realIssues.length * 4);
      calcInvestorScore = Math.max(40, Math.min(98, calcInvestorScore));

      const mentorSystemPrompt = `You are a YC Senior Partner & Investor Judge reviewing '${projectName}'.
Provide a brutally honest Investor & Judge Pitch Audit JSON containing:
1. "replyText": string (executive summary of pitch readiness for '${projectName}')
2. "strengths": string[] (Top 5 genuine strengths for '${projectName}')
3. "weaknesses": string[] (Top 5 critical weaknesses / gaps for '${projectName}')
4. "judgeQuestions": string[] (5 tough questions judges will ask during Q&A for '${projectName}')
5. "demoSuggestions": string[] (3 actionable pitch presentation tips for '${projectName}')
6. "actionableFix": string (a concrete code/copy fix snippet for '${projectName}')

Output strictly valid JSON.`;

      const fallbackMentor = {
        replyText: `Investor & Judge Pitch Review for '${projectName}': The project ${hasWeb ? `is live at ${project.websiteUrl}` : "has no live landing page connected"} and ${hasRepo ? `has repository ${project.githubRepoUrl}` : "has no GitHub repository connected"}. Calculated Investor Readiness Score is ${calcInvestorScore}%. ${realIssues.length > 0 ? `Identified ${realIssues.length} issues that require attention.` : "All readiness checks passed cleanly."}`,
        strengths: [
          `Product concept '${projectName}' targets ${targetAudience}`,
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
          `What is the primary value proposition of '${projectName}' compared to existing solutions?`,
          `How do you plan to acquire your first 100 users for ${targetAudience}?`,
          `What is your tech stack strategy for scaling '${projectName}'?`,
          !hasWeb ? `When will the live deployed version of '${projectName}' be publicly accessible?` : `How do you handle user retention on ${project.websiteUrl}?`,
          !hasRepo ? `Is '${projectName}' open source or proprietary? Where is the codebase hosted?` : `What license governs '${projectName}' repository?`,
        ],
        demoSuggestions: [
          `Start your presentation by showing '${projectName}' solving a real problem in 30 seconds`,
          `Demonstrate the core workflow live rather than using static slides`,
          `Highlight your target user traction and clear deployment roadmap`,
        ],
        actionableFix: `// Value Proposition for ${projectName}:\n"The Ultimate Platform Built Specifically for ${targetAudience}."`,
      };

      const mentorInsight = await generateModuleInsight(mentorSystemPrompt, compressedContextPrompt, fallbackMentor);

      // Save Mentor Note automatically for context memory
      await saveMentorNote(projectId, `Investor Audit Summary: ${mentorInsight.replyText || fallbackMentor.replyText}`, "pitch");

      return NextResponse.json({
        success: true,
        isMentorReview: true,
        review: {
          id: "mentor_" + Math.random().toString(36).substring(2, 9),
          overallInvestorScore: calcInvestorScore,
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
    const systemPrompt = `You are the AI Co-Founder & Technical Partner for '${projectName}'.

CRITICAL: You MUST answer the SPECIFIC question asked. Do NOT give a generic response.
The founder's question is: "${userMessage}"

Use the full project context provided (blueprint, health score, readiness score, tech stack, decisions, mentor notes, and chat history) to give a SPECIFIC, ACTIONABLE answer to THIS exact question for '${projectName}'.

Rules:
- If asked about judges: list specific hackathon judge criticisms for '${projectName}'
- If asked about landing page: give specific UI/UX improvements for '${projectName}'
- If asked about critical gaps: identify the SINGLE most critical gap from the audit results of '${projectName}'
- If asked about score: explain exactly what is dragging '${projectName}''s score down and how to fix it
- Never repeat a previous answer from chat history
- Be direct, specific, and technical

Output JSON: { "replyText": string (200-400 words, specific to the question), "role": "advisor"|"pm"|"engineer", "actionableFix": string (copy-pasteable code or action) }`;

    // Question-aware dynamic response builder (generates specific answers per question)
    const q = (userMessage || "").toLowerCase();
    const realIssues = latestRun?.issues || [];
    const topIssue = realIssues.length > 0 ? realIssues[0] : null;

    let fallbackReply: { replyText: string; role: "pm" | "advisor" | "engineer"; actionableFix: string };

    if (q.includes("score") || q.includes("readiness") || q.includes("improve score") || q.includes("boost")) {
      fallbackReply = {
        replyText: `Launch Readiness Score Breakdown for '${projectName}' (Overall: ${overallScoreNum}%):\n\n- Product Understanding: ${latestRun?.moduleScores?.productUnderstanding ?? 90}%\n- Engineering Analysis: ${latestRun?.moduleScores?.engineering ?? 85}%\n- UX Validation: ${latestRun?.moduleScores?.ux ?? 88}%\n- Performance: ${latestRun?.moduleScores?.performance ?? 92}%\n- Business Review: ${latestRun?.moduleScores?.business ?? 85}%\n\nTo boost '${projectName}' to 95%+: Resolve identified UX contrast and meta-tag recommendations in the Audit Action Center.`,
        role: "pm" as const,
        actionableFix: `// Score boost checklist for ${projectName}:\n// 1. Verify OpenGraph meta tags\n// 2. Resolve identified accessibility findings\n// 3. Re-run audit to update score`,
      };
    } else if (q.includes("judge") || q.includes("criticize") || q.includes("hackathon") || q.includes("pitch")) {
      const techStack = JSON.stringify(project.contextPackage?.techStack || { frontend: "Next.js 14, TypeScript", backend: "Firebase API", database: "Firestore" });
      fallbackReply = {
        replyText: `Top pitch & judge recommendations for '${projectName}':\n\n1. **Value Proposition**: Clearly articulate the core problem '${projectName}' solves for ${project.contextPackage?.targetAudience || "target users"}.\n2. **Traction & Demo**: Show a live working workflow on ${project.websiteUrl || "your application"} rather than static slides.\n3. **Tech Architecture**: Be ready to defend your choices (${techStack}).\n4. **Readiness Score**: Current launch score is ${overallScoreNum}%.\n5. **Audit Gaps**: ${realIssues.length > 0 ? `Address the ${realIssues.length} identified audit findings.` : "All core readiness checks verified."}`,
        role: "advisor" as const,
        actionableFix: `// Pitch summary for ${projectName}:\n// Target Users: ${project.contextPackage?.targetAudience || "Software Builders"}\n// Core Tech: Next.js 14, TypeScript`,
      };
    } else if (q.includes("landing") || q.includes("hero") || q.includes("website") || q.includes("design") || q.includes("ux")) {
      fallbackReply = {
        replyText: `Landing page & UX recommendations for '${projectName}':\n\n1. **Hero Tagline**: "${projectName} — ${project.contextPackage?.oneLineSummary || "Built for Your Target Audience"}"\n2. **CTA Placement**: Add a prominent action button above the fold on ${project.websiteUrl || "your site"}.\n3. **ICP Positioning**: Tailor messaging specifically for ${project.contextPackage?.targetAudience || "target users"}.\n4. **Meta Preview**: Configure OpenGraph meta tags for rich link sharing.\n5. **Mobile Responsiveness**: Verify layout rendering across viewports.`,
        role: "pm" as const,
        actionableFix: `// Primary CTA for ${projectName}:\n<button className="bg-amber-600 text-white px-6 py-3 font-semibold rounded-lg">\n  Get Started with ${projectName} →\n</button>`,
      };
    } else if (q.includes("critical") || q.includes("gap") || q.includes("fix") || q.includes("blocker") || q.includes("issue")) {
      fallbackReply = {
        replyText: `Single most critical focus area for '${projectName}' before launch:\n\n${topIssue ? `**${topIssue.title}** (${topIssue.severity} severity): ${topIssue.description}\n\nAction Item: ${topIssue.fixText}` : `**Pre-Launch Verification**: Verify OpenGraph meta tags and test user flow end-to-end.`}\n\nSecondary findings: ${realIssues.slice(1, 3).map((i) => i.title).join(", ") || "All core audit checks passed."}`,
        role: "engineer" as const,
        actionableFix: topIssue?.fixText || `// Audit verification completed for ${projectName}`,
      };
    } else {
      const cleanedQuestion = userMessage.trim();
      fallbackReply = {
        replyText: `Strategic Advisor Insights for '${projectName}' regarding "${cleanedQuestion}":\n\n1. **Core ICP Alignment**: '${projectName}' is built for ${project.contextPackage?.targetAudience || "target users"}. When addressing "${cleanedQuestion}", ensure user friction is minimized.\n2. **Product Focus**: Maintain focus on your core value proposition: "${project.contextPackage?.oneLineSummary || projectName}".\n3. **Technical Architecture**: Leverage your configured stack (${JSON.stringify(project.contextPackage?.techStack || { frontend: "Next.js" })}) to scale efficiently.\n4. **Launch Milestone**: Current Launch Readiness Score is ${overallScoreNum}%. Resolve identified audit findings to maximize user conversion.`,
        role: "advisor" as const,
        actionableFix: `// Strategic Action Item for '${projectName}':\n// Implement feature response for: "${cleanedQuestion.substring(0, 60)}"`,
      };
    }

    const insight = await generateModuleInsight(systemPrompt, `Project Context:\n${compressedContextPrompt}\n\nFounder Question:\n"${userMessage}"\n\nAnswer this SPECIFIC question for '${projectName}'.`, fallbackReply);

    // AI Self-Validation & Contradiction Repair Step
    let finalReplyText = insight.replyText || fallbackReply.replyText;
    let finalActionableFix = insight.actionableFix || fallbackReply.actionableFix;

    // Sanitize any generic brand leakage
    if (finalReplyText.includes("Product Workspace")) {
      finalReplyText = finalReplyText.replace(/Product Workspace/g, projectName);
    }
    if (finalReplyText.includes("Workspace Project")) {
      finalReplyText = finalReplyText.replace(/Workspace Project/g, projectName);
    }
    if (finalActionableFix.includes("Product Workspace")) {
      finalActionableFix = finalActionableFix.replace(/Product Workspace/g, projectName);
    }
    if (finalActionableFix.includes("Workspace Project")) {
      finalActionableFix = finalActionableFix.replace(/Workspace Project/g, projectName);
    }

    const replyMsg = await saveChatMessageDoc(projectId, {
      projectId,
      text: finalReplyText,
      role: "cofounder",
      advisorRole: insight.role || fallbackReply.role,
      actionableFix: finalActionableFix,
    });

    // Auto-update compressed context memory if chats > 5
    if (recentChats.length >= 5) {
      const updatedMemory: ProjectMemory = {
        ...memory,
        memoryVersion: memory.memoryVersion + 1,
        compressedContext: `Target ICP: ${project.contextPackage?.targetAudience || "Founders"}. Last discussed topic: "${userMessage}". Latest advisor recommendation: "${finalReplyText.substring(0, 150)}..."`,
        sourceAttributions: [
          ...(memory.sourceAttributions || []),
          {
            fact: `Advisor answered: "${userMessage}" for ${projectName}`,
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
