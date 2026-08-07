import { Issue } from "@/lib/types/schema";
import { scrapeLandingPage, ScrapedPageData } from "@/lib/scraping/scraper";
import { generateModuleInsight } from "@/lib/utils/openai";

export interface ProductUnderstandingResult {
  status: "completed" | "skipped" | "failed";
  reason?: string;
  score: number | null;
  issues: Issue[];
  summary: string;
  targetAudience: string;
  valueProposition: string;
}

export async function runProductUnderstanding(
  websiteUrl: string
): Promise<ProductUnderstandingResult> {
  try {
    const pageData: ScrapedPageData | null = await scrapeLandingPage(websiteUrl);

    if (!pageData || !pageData.isReachable) {
      const statusReason = `Website URL ${websiteUrl} is unreachable (HTTP ${pageData?.httpStatus || 404})`;
      return {
        status: "failed",
        reason: statusReason,
        score: null,
        issues: [
          {
            id: "prod-website-unreachable",
            category: "product",
            severity: "critical",
            title: `Website Offline or Unreachable (HTTP ${pageData?.httpStatus || 404})`,
            description: `Problem: The target website URL (${websiteUrl}) returned HTTP ${pageData?.httpStatus || 404} or failed DNS lookup.\nWhy it matters: Pre-launch readiness audit requires a live landing page to evaluate product value proposition, typography, and meta tags.\nConfidence: 100%`,
            fixText: `Deploy a live website to ${websiteUrl} and run audit again.`,
          },
        ],
        summary: "Target website is unreachable or offline.",
        targetAudience: "Unknown",
        valueProposition: "Unknown",
      };
    }

    // Deterministic signals
    const hasTitle = pageData.title.length > 5;
    const hasMetaDesc = pageData.metaDescription.length > 20;
    const hasHeadings = pageData.headings.length >= 2;
    const wordCount = pageData.textLength;

    let score = 0;
    if (hasTitle) score += 25;
    if (hasMetaDesc) score += 30;
    if (hasHeadings) score += 25;
    if (wordCount > 300) score += 20;

    const issues: Issue[] = [];

    if (!hasMetaDesc) {
      issues.push({
        id: "prod-missing-meta",
        category: "product",
        severity: "high",
        title: "Missing SEO & OpenGraph description meta tag",
        description: "Your landing page lacks a meta description tag. Search engines and link previews (Twitter, Slack) will render generic URL text.",
        fixText: `<meta name="description" content="${pageData.title || 'Product'} — The fastest way to validate pre-launch readiness and fix critical bugs before launch day." />`,
      });
    }

    if (pageData.title.length < 10) {
      issues.push({
        id: "prod-short-title",
        category: "product",
        severity: "medium",
        title: "Page title tag is underspecified",
        description: "The `<title>` tag should contain both product name and primary core benefit.",
        fixText: `<title>${pageData.title || 'Prodexa'} — Autonomous Pre-Launch Readiness Platform</title>`,
      });
    }

    // LLM evaluation for value proposition copy & positioning
    const systemPrompt = `You are a Lead Product Strategist. Analyze the landing page copy below and extract:
1. "summary": 2-sentence summary of what the product actually does.
2. "valueProposition": clear 1-line statement of core value prop.
3. "targetAudience": explicit target customer segment.

Output strictly JSON format.`;

    const userContent = `Page Title: ${pageData.title}
Meta Description: ${pageData.metaDescription}
Headings: ${pageData.headings.map((h) => h.text).join(" | ")}
Body snippet: ${pageData.bodyText.substring(0, 1500)}`;

    const fallbackJSON = {
      summary: `${pageData.title || "Target product"} provides web services and tools for users.`,
      valueProposition: pageData.metaDescription || pageData.title || "Pre-launch product validation",
      targetAudience: "Early-stage founders, hackathon builders, and software teams.",
    };

    const insight = await generateModuleInsight(systemPrompt, userContent, fallbackJSON);

    return {
      status: "completed",
      score,
      issues,
      summary: insight.summary || fallbackJSON.summary,
      valueProposition: insight.valueProposition || fallbackJSON.valueProposition,
      targetAudience: insight.targetAudience || fallbackJSON.targetAudience,
    };
  } catch (error: any) {
    return {
      status: "failed",
      reason: `Product Understanding error: ${error.message || "Failed to analyze product copy"}`,
      score: null,
      issues: [],
      summary: "Product understanding degraded.",
      targetAudience: "Unknown",
      valueProposition: "Unknown",
    };
  }
}
