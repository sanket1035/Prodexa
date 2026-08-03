import { Issue } from "@/lib/types/schema";
import { scrapeLandingPage, ScrapedPageData } from "@/lib/scraping/scraper";

export interface UxValidationResult {
  status: "completed" | "skipped" | "failed";
  reason?: string;
  score: number | null;
  issues: Issue[];
  details: {
    hasViewport: boolean;
    hasPrimaryCta: boolean;
    missingAltCount: number;
    h1Count: number;
  };
}

export async function runUxValidation(websiteUrl: string): Promise<UxValidationResult> {
  try {
    const pageData: ScrapedPageData | null = await scrapeLandingPage(websiteUrl);

    if (!pageData) {
      return {
        status: "failed",
        reason: "Landing page HTML unreachable for UX heuristic audit",
        score: null,
        issues: [],
        details: { hasViewport: false, hasPrimaryCta: false, missingAltCount: 0, h1Count: 0 },
      };
    }

    const hasViewport = pageData.hasViewportMeta;
    const hasPrimaryCta = pageData.buttons.length > 0;
    const missingAltCount = pageData.images.filter((img) => !img.alt || img.alt.trim() === "").length;
    const h1Count = pageData.headings.filter((h) => h.level === "h1").length;

    // Deterministic Score Calculation
    let score = 0;
    if (hasViewport) score += 30;
    if (hasPrimaryCta) score += 30;
    if (h1Count === 1) score += 20;
    else if (h1Count > 0) score += 10;
    if (missingAltCount === 0) score += 20;
    else score += Math.max(0, 20 - missingAltCount * 4);

    const issues: Issue[] = [];

    if (!hasViewport) {
      issues.push({
        id: "ux-missing-viewport",
        category: "ux",
        severity: "critical",
        title: "Missing mobile viewport meta tag",
        description: "Mobile browsers will scale down the page to a desktop width of 980px, causing severe readability and zoom issues.",
        fixText: `<meta name="viewport" content="width=device-width, initial-scale=1.0" />`,
      });
    }

    if (!hasPrimaryCta) {
      issues.push({
        id: "ux-missing-cta",
        category: "ux",
        severity: "high",
        title: "No explicit primary Call-To-Action (CTA) button detected above fold",
        description: "Founders and judges should see a prominent primary action within 3 seconds of landing.",
        fixText: `<button className="bg-[#D97B3F] hover:bg-[#E88A4E] text-[#0B0C0E] font-medium px-5 py-2.5 rounded-[6px] transition-colors focus-visible:outline-2 focus-visible:outline-[#D97B3F]">
  Get Started Now
</button>`,
      });
    }

    if (h1Count !== 1) {
      issues.push({
        id: "ux-h1-hierarchy",
        category: "ux",
        severity: "medium",
        title: h1Count === 0 ? "Missing <h1> headline tag" : "Multiple <h1> tags detected",
        description: `Found ${h1Count} <h1> element(s). Pages must have exactly one <h1> heading for proper screen-reader navigation and SEO structure.`,
        fixText: `<h1>${pageData.headings[0]?.text || pageData.title || 'Product Name'}</h1>`,
      });
    }

    if (missingAltCount > 0) {
      issues.push({
        id: "ux-missing-alt",
        category: "ux",
        severity: "low",
        title: `${missingAltCount} image(s) missing descriptive alt text`,
        description: "Screen readers skip image descriptions when `alt` attributes are blank.",
        fixText: `<img src="/screenshot.png" alt="Prodexa Launch Readiness Dashboard interface preview" width={1200} height={630} />`,
      });
    }

    return {
      status: "completed",
      score,
      issues,
      details: {
        hasViewport,
        hasPrimaryCta,
        missingAltCount,
        h1Count,
      },
    };
  } catch (error: any) {
    return {
      status: "failed",
      reason: `UX Validation error: ${error.message}`,
      score: null,
      issues: [],
      details: { hasViewport: false, hasPrimaryCta: false, missingAltCount: 0, h1Count: 0 },
    };
  }
}
