import { Issue } from "@/lib/types/schema";
import { scrapeLandingPage } from "@/lib/scraping/scraper";
import { generateModuleInsight } from "@/lib/utils/openai";

export interface BusinessReviewResult {
  status: "completed" | "skipped" | "failed";
  reason?: string;
  score: number | null;
  issues: Issue[];
  businessModel: string;
  pricingMentioned: boolean;
  contactProvided: boolean;
}

export async function runBusinessReview(
  websiteUrl: string,
  pitchDeckText?: string
): Promise<BusinessReviewResult> {
  try {
    const pageData = await scrapeLandingPage(websiteUrl);
    const textContent = `${pageData?.bodyText || ""} ${pitchDeckText || ""}`.toLowerCase();

    const pricingMentioned =
      textContent.includes("price") ||
      textContent.includes("pricing") ||
      textContent.includes("plan") ||
      textContent.includes("tier") ||
      textContent.includes("free") ||
      textContent.includes("$") ||
      textContent.includes("pro");

    const contactProvided =
      textContent.includes("contact") ||
      textContent.includes("support") ||
      textContent.includes("email") ||
      textContent.includes("twitter") ||
      textContent.includes("discord") ||
      textContent.includes("github") ||
      textContent.includes("@");

    const teamMentioned =
      textContent.includes("team") ||
      textContent.includes("about us") ||
      textContent.includes("founder") ||
      textContent.includes("built by");

    // Deterministic score calculation
    let score = 0;
    if (pricingMentioned) score += 35;
    if (contactProvided) score += 35;
    if (teamMentioned) score += 30;

    const issues: Issue[] = [];

    if (!pricingMentioned) {
      issues.push({
        id: "biz-missing-pricing",
        category: "business",
        severity: "high",
        title: "No explicit pricing or business model mentioned",
        description: "Early-stage products should clarify pricing structure (Free tier, Freemium, or Subscription) to build trust.",
        fixText: `### Pricing Tiers
- **Community**: Free forever for open-source & hackathon projects.
- **Pro**: $19/mo for automated continuous readiness tracking.`,
      });
    }

    if (!contactProvided) {
      issues.push({
        id: "biz-missing-contact",
        category: "business",
        severity: "medium",
        title: "Missing clear contact or support channel link",
        description: "No support email, Discord, or Twitter link was detected in footer or navigation.",
        fixText: `<div className="text-xs text-[#8B8F97]">
  Have feedback? Add a support channel: <a href="mailto:support@yourdomain.com" className="text-[#D97B3F] underline">support@yourdomain.com</a>
</div>`, // FB-004 FIX: removed support@prodexa.ai hardcoded reference
      });
    }

    // LLM synthesis for business model clarity
    const systemPrompt = `You are a Startup Advisor & Business Auditor. Analyze text and output JSON: { "businessModel": string }`;
    const userContent = `Page Copy Snippet: ${textContent.substring(0, 1500)}`;
    const fallbackJSON = {
      businessModel: pricingMentioned ? "SaaS / Subscription software model" : "Early access / Free public utility model",
    };

    const insight = await generateModuleInsight(systemPrompt, userContent, fallbackJSON);

    return {
      status: "completed",
      score,
      issues,
      businessModel: insight.businessModel || fallbackJSON.businessModel,
      pricingMentioned,
      contactProvided,
    };
  } catch (error: any) {
    return {
      status: "failed",
      reason: `Business Review error: ${error.message}`,
      score: null,
      issues: [],
      businessModel: "Unknown",
      pricingMentioned: false,
      contactProvided: false,
    };
  }
}
