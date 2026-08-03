import { Issue } from "@/lib/types/schema";
import { scrapeLandingPage } from "@/lib/scraping/scraper";

export interface PerformanceAuditResult {
  status: "completed" | "skipped" | "failed";
  reason?: string;
  score: number | null;
  issues: Issue[];
  details: {
    responseTimeMs: number;
    estimatedPageSizeBytes: number;
    scriptCount: number;
  };
}

export async function runPerformanceAudit(websiteUrl: string): Promise<PerformanceAuditResult> {
  try {
    const startTime = Date.now();
    const pageData = await scrapeLandingPage(websiteUrl);
    const responseTimeMs = pageData ? pageData.fetchTimeMs : Date.now() - startTime;

    if (!pageData) {
      return {
        status: "failed",
        reason: "Performance audit unable to measure site latency",
        score: null,
        issues: [],
        details: { responseTimeMs: 0, estimatedPageSizeBytes: 0, scriptCount: 0 },
      };
    }

    const estimatedPageSizeBytes = pageData.htmlContent.length * 4; // approximate
    const scriptMatches = pageData.htmlContent.match(/<script/gi);
    const scriptCount = scriptMatches ? scriptMatches.length : 0;

    // Deterministic Score based on real empirical latency & payload
    let score = 100;
    if (responseTimeMs > 500) score -= 15;
    if (responseTimeMs > 1500) score -= 20;
    if (responseTimeMs > 3000) score -= 30;

    if (scriptCount > 15) score -= 15;
    if (estimatedPageSizeBytes > 500000) score -= 10;

    score = Math.max(20, Math.min(100, score));

    const issues: Issue[] = [];

    if (responseTimeMs > 1200) {
      issues.push({
        id: "perf-high-latency",
        category: "performance",
        severity: responseTimeMs > 2500 ? "critical" : "high",
        title: `High initial server response latency (${responseTimeMs}ms)`,
        description: `Initial HTML fetch took ${responseTimeMs}ms. Ideal target for pre-launch landing pages is under 400ms.`,
        fixText: `// Enable Vercel / Next.js Edge Caching headers in next.config.mjs:
export default {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=59' }
        ],
      },
    ];
  },
};`,
      });
    }

    if (scriptCount > 20) {
      issues.push({
        id: "perf-many-scripts",
        category: "performance",
        severity: "medium",
        title: `Excessive JavaScript script tags (${scriptCount} external scripts)`,
        description: "Multiple blocking external scripts delay Main Thread execution and degrade First Input Delay (FID).",
        fixText: `// Load non-critical analytics or widget scripts asynchronously with defer or strategy="lazyOnload"
<Script src="https://example.com/widget.js" strategy="lazyOnload" />`,
      });
    }

    return {
      status: "completed",
      score,
      issues,
      details: {
        responseTimeMs,
        estimatedPageSizeBytes,
        scriptCount,
      },
    };
  } catch (error: any) {
    return {
      status: "failed",
      reason: `Performance audit error: ${error.message}`,
      score: null,
      issues: [],
      details: { responseTimeMs: 0, estimatedPageSizeBytes: 0, scriptCount: 0 },
    };
  }
}
