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
    hasOgTags: boolean;
    hasCanonical: boolean;
    hasFavicon: boolean;
  };
}

export async function runUxValidation(websiteUrl: string): Promise<UxValidationResult> {
  try {
    const pageData: ScrapedPageData | null = await scrapeLandingPage(websiteUrl);

    if (!pageData || !pageData.isReachable) {
      return {
        status: "failed",
        reason: `UX validation skipped: website ${websiteUrl} is offline (HTTP ${pageData?.httpStatus || 404})`,
        score: null,
        issues: [],
        details: { hasViewport: false, hasPrimaryCta: false, missingAltCount: 0, h1Count: 0, hasOgTags: false, hasCanonical: false, hasFavicon: false },
      };
    }

    const hasViewport = pageData.hasViewportMeta;
    const hasPrimaryCta = pageData.buttons.length > 0;
    const missingAltCount = pageData.missingAltCount;
    const h1Count = pageData.h1Count;
    const hasOgTags = pageData.hasOgTitle && pageData.hasOgImage;
    const hasCanonical = !!pageData.canonicalUrl;
    const hasFavicon = pageData.hasFavicon;

    // Deterministic Score Calculation
    let score = 0;
    if (hasViewport) score += 25;
    if (hasPrimaryCta) score += 25;
    if (h1Count === 1) score += 15;
    else if (h1Count > 0) score += 8;
    if (hasOgTags) score += 15;
    if (hasFavicon) score += 10;
    if (missingAltCount === 0) score += 10;
    else score += Math.max(0, 10 - missingAltCount * 2);

    const issues: Issue[] = [];

    if (!hasViewport) {
      issues.push({
        id: "ux-missing-viewport",
        category: "ux",
        severity: "critical",
        title: "Missing mobile viewport meta tag",
        description: "Problem: Mobile browsers scale down the page to desktop 980px width.\nWhy it matters: Causes severe readability issues on mobile screens.\nConfidence: 99%",
        fixText: `<meta name="viewport" content="width=device-width, initial-scale=1.0" />`,
      });
    }

    if (!hasPrimaryCta) {
      issues.push({
        id: "ux-missing-cta",
        category: "ux",
        severity: "high",
        title: "No prominent Call-To-Action (CTA) button detected",
        description: "Problem: Landing page lacks clear CTA above the fold.\nWhy it matters: Drops visitor conversion rates by up to 60%.\nConfidence: 95%",
        fixText: `<button className="bg-[#D97706] text-[#09090B] px-5 py-2.5 font-semibold rounded-xl">\n  Get Started Free →\n</button>`,
      });
    }

    if (!hasOgTags) {
      issues.push({
        id: "ux-missing-og",
        category: "ux",
        severity: "medium",
        title: "Missing OpenGraph social sharing meta tags (og:title / og:image)",
        description: "Problem: Social media previews (X, LinkedIn, Slack) render without image or card title.\nWhy it matters: Degrades CTR when shared on social channels.\nConfidence: 98%",
        fixText: `<meta property="og:title" content="${pageData.title}" />\n<meta property="og:image" content="https://yourdomain.com/og-preview.png" />\n<meta name="twitter:card" content="summary_large_image" />`,
      });
    }

    if (h1Count !== 1) {
      issues.push({
        id: "ux-h1-hierarchy",
        category: "ux",
        severity: "medium",
        title: h1Count === 0 ? "Missing <h1> headline tag" : "Multiple <h1> tags detected",
        description: `Problem: Found ${h1Count} <h1> tags.\nWhy it matters: Confuses screen readers and degrades SEO heading hierarchy.\nConfidence: 95%`,
        fixText: `<h1>${pageData.headings[0]?.text || pageData.title}</h1>`,
      });
    }

    if (!hasFavicon) {
      issues.push({
        id: "ux-missing-favicon",
        category: "ux",
        severity: "low",
        title: "Missing site favicon shortcut icon",
        description: "Problem: Browser tabs display generic blank document icon.\nWhy it matters: Degrades brand trust during pitch reviews.\nConfidence: 99%",
        fixText: `<link rel="icon" href="/favicon.ico" sizes="any" />`,
      });
    }

    if (missingAltCount > 0) {
      issues.push({
        id: "ux-missing-alt",
        category: "ux",
        severity: "low",
        title: `${missingAltCount} image(s) missing descriptive alt attributes`,
        description: "Problem: Images lack descriptive alt text.\nWhy it matters: Screen readers skip images and SEO accessibility drops.\nConfidence: 92%",
        fixText: `<img src="/screenshot.png" alt="Product launch interface preview" />`,
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
        hasOgTags,
        hasCanonical,
        hasFavicon,
      },
    };
  } catch (error: any) {
    return {
      status: "failed",
      reason: `UX validation error: ${error.message}`,
      score: null,
      issues: [],
      details: { hasViewport: false, hasPrimaryCta: false, missingAltCount: 0, h1Count: 0, hasOgTags: false, hasCanonical: false, hasFavicon: false },
    };
  }
}
