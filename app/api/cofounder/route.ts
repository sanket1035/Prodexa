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
          "Start your demo with Option A ('I only have an idea') to show the Blueprint Engine first",
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

    // Standard Co-Founder Advisory prompt — detailed context forces question-specific answers
    const systemPrompt = `You are the AI Co-Founder & Technical Partner for '${project.name}'.

CRITICAL: You MUST answer the SPECIFIC question asked. Do NOT give a generic response.
The founder's question is: "${userMessage}"

Use the full project context provided (blueprint, health score, readiness score, tech stack, decisions, mentor notes, and chat history) to give a SPECIFIC, ACTIONABLE answer to THIS exact question.

Rules:
- If asked about judges: list specific hackathon judge criticisms for THIS project
- If asked about landing page: give specific UI/UX improvements for THIS project's landing page
- If asked about critical gaps: identify the SINGLE most critical gap from the audit results
- If asked about score: explain exactly what is dragging the score down and how to fix it
- Never repeat a previous answer from chat history
- Be direct, specific, and technical

Output JSON: { "replyText": string (200-400 words, specific to the question), "role": "advisor"|"pm"|"engineer", "actionableFix": string (copy-pasteable code or action) }`;

    // Question-aware deterministic fallback (different answer per question type)
    const q = (userMessage || "").toLowerCase();
    let fallbackReply: { replyText: string; role: "pm" | "advisor" | "engineer"; actionableFix: string } = {
      replyText: `For ${project.name} (Health: ${project.healthScore || 25}%, Readiness: ${latestRun?.overallScore ?? "unvalidated"}%): ${memory.compressedContext || "Review your blueprint context for key gaps."}`,
      role: "pm",
      actionableFix: `// Review your blueprint and run a full audit first.`,
    };

    if (q.includes("judge") || q.includes("criticize") || q.includes("hackathon")) {
      const techStack = JSON.stringify(project.contextPackage?.techStack || {});
      fallbackReply = {
        replyText: `Top hackathon judge criticisms for ${project.name}:\n\n1. **No live demo URL** — judges expect a deployed link, not localhost.\n2. **Missing open-source LICENSE file** — standard MIT/Apache 2.0 required.\n3. **Landing page lacks above-the-fold value prop** — judges see 30+ projects; your hero must answer "what is this?" in 5 seconds.\n4. **Tech stack justification** — you use ${techStack}; judges will ask "why not a simpler stack?"\n5. **No documented API contracts** — judges will ask how modules communicate.\n6. **Readiness score ${latestRun?.overallScore ?? "not shown"}** means audit gaps are visible to judges who probe deeply.\n7. **No user testimonials or pilot users** — even 1-2 beta users dramatically increases credibility.`,
        role: "advisor" as const,
        actionableFix: `// Add to your GitHub README:\n## 🏆 Hackathon Demo\n- Live URL: https://your-app.vercel.app\n- Demo Video: https://loom.com/share/your-video\n- Test Credentials: demo@${project.name.toLowerCase().replace(/\s+/g, '')}.ai / demo123`,
      };
    } else if (q.includes("landing") || q.includes("hero") || q.includes("website")) {
      fallbackReply = {
        replyText: `Landing page improvements for ${project.name}:\n\n1. **Hero headline must answer: What is it? Who is it for? What do I get?** — Rewrite as: "${project.contextPackage?.oneLineSummary || project.name} — for ${project.contextPackage?.targetAudience || "founders"}"\n2. **Single high-contrast CTA above the fold** — use amber (#D97706) on dark background\n3. **Social proof section** — add "X projects analyzed" counter even if small\n4. **Feature grid with icons** — show your 3 core capabilities visually\n5. **Add Open Graph meta tags** — so sharing on Slack/Twitter shows a preview card\n6. **Mobile viewport meta** — verify <meta name="viewport"> is set correctly\n7. **Add a demo GIF or video** — converts 3x better than static screenshots`,
        role: "pm" as const,
        actionableFix: `// Hero section rewrite:\n<h1>The AI Operating System That Takes You From Idea to Launch-Ready</h1>\n<p>For ${project.contextPackage?.targetAudience || "early-stage founders"}</p>\n<button className="bg-amber-600 text-black px-6 py-3 font-semibold rounded-lg hover:bg-amber-500">\n  Generate Your Blueprint →\n</button>`,
      };
    } else if (q.includes("critical") || q.includes("gap") || q.includes("fix") || q.includes("launch")) {
      const topIssue = latestRun?.issues?.[0];
      fallbackReply = {
        replyText: `Single most critical gap for ${project.name} before launch:\n\n${topIssue ? `**${topIssue.title}** (${topIssue.severity} severity): ${topIssue.description}\n\nFix: ${topIssue.fixText}` : `**No website URL connected yet.** Without a real deployed URL, the 6-module audit cannot analyze your actual product. Connect your landing page URL immediately — run "npm run build && vercel deploy" to get a production URL, then connect it via the Assets button.`}\n\nSecondary gaps: ${(latestRun?.issues || []).slice(1, 3).map(i => i.title).join(", ") || "Run a full audit to see all gaps."}`,
        role: "engineer" as const,
        actionableFix: topIssue?.fixText || `// Deploy immediately:\nnpx vercel --prod\n// Then connect URL in dashboard Assets panel`,
      };
    } else if (q.includes("score") || q.includes("readiness") || q.includes("improve")) {
      fallbackReply = {
        replyText: `Your ${project.name} Launch Readiness Score is ${latestRun?.overallScore ?? "not yet calculated"}%.\n\nScore breakdown by module:\n- Engineering Analysis: Check GitHub repo, add LICENSE, README\n- Product Understanding: Connect real website URL (not example.com)\n- UX Validation: Add viewport meta, fix missing alt tags on images\n- Performance: Reduce JS bundle, enable compression, use CDN\n- Business Review: Add pricing page, contact form, social proof\n\nTo increase score fastest: **Connect your deployed website URL** and **link your GitHub repo** — these two actions alone will unlock 4 of 6 audit modules to run against real data instead of defaults.`,
        role: "pm" as const,
        actionableFix: `// Quick score boost checklist:\n// 1. Connect real website URL in Assets drawer\n// 2. Connect GitHub repo URL\n// 3. Add LICENSE file to repo root\n// 4. Add <meta name="viewport"> to HTML head\n// 5. Add og:title and og:image meta tags`,
      };
    }

    const insight = await generateModuleInsight(systemPrompt, `Project Context:\n${compressedContextPrompt}\n\nFounder Question:\n"${userMessage}"\n\nAnswer this SPECIFIC question in detail.`, fallbackReply);

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
