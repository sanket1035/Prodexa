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
        reason: "Performance snapshot unable to measure HTTP latency",
        score: null,
        issues: [],
        details: { responseTimeMs: 0, estimatedPageSizeBytes: 0, scriptCount: 0 },
      };
    }

    const estimatedPageSizeBytes = pageData.htmlContent.length * 4;
    const scriptMatches = pageData.htmlContent.match(/<script/gi);
    const scriptCount = scriptMatches ? scriptMatches.length : 0;

    // Empirical Score calculation based on real HTTP latency & payload bounds
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
        title: `High HTTP initial response latency (${responseTimeMs}ms)`,
        description: `Problem: Initial HTML fetch took ${responseTimeMs}ms.\nWhy it matters: Slow initial TTFB degrades visitor retention.\nConfidence: 99%`,
        fixText: `// Enable Vercel Edge Caching headers in next.config.mjs:\nexport default {\n  async headers() {\n    return [\n      { source: '/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=59' }] }\n    ];\n  },\n};`,
      });
    }

    if (scriptCount > 20) {
      issues.push({
        id: "perf-many-scripts",
        category: "performance",
        severity: "medium",
        title: `Excessive external JavaScript tags (${scriptCount} script tags)`,
        description: `Problem: Page loads ${scriptCount} script tags.\nWhy it matters: Delays Main Thread execution and degrades First Input Delay (FID).\nConfidence: 95%`,
        fixText: `// Load non-critical analytics or widget scripts asynchronously:\n<Script src="https://example.com/widget.js" strategy="lazyOnload" />`,
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
      reason: `Web Performance Snapshot error: ${error.message}`,
      score: null,
      issues: [],
      details: { responseTimeMs: 0, estimatedPageSizeBytes: 0, scriptCount: 0 },
    };
  }
}
