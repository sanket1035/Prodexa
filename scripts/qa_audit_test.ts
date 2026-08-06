import { runEngineeringAnalysis } from "../lib/modules/engineering-analysis";
import { scrapeLandingPage } from "../lib/scraping/scraper";

async function testWebsiteScraper() {
  console.log("=== EMPIRICAL TEST: WEBSITE SCRAPER ===");
  const urls = [
    "https://nextjs.org",
    "https://vercel.com",
    "https://react.dev",
    "https://invalid-nonexistent-domain-9999.com"
  ];

  for (const url of urls) {
    const t0 = Date.now();
    try {
      const data = await scrapeLandingPage(url);
      const timeMs = Date.now() - t0;
      console.log(`[URL]: ${url} | Time: ${timeMs}ms | Title: "${data?.title}" | H1s: ${data?.h1Count} | OG: ${data?.hasOgTitle} | Favicon: ${data?.hasFavicon}`);
    } catch (e: any) {
      console.log(`[URL]: ${url} | Failed: ${e.message}`);
    }
  }
}

async function testGitHubAnalysis() {
  console.log("\n=== EMPIRICAL TEST: GITHUB REPO ANALYSIS ===");
  const repos = [
    { label: "Valid Repo (React)", url: "https://github.com/facebook/react" },
    { label: "Huge Repo (Next.js)", url: "https://github.com/vercel/next.js" },
    { label: "Invalid Repo", url: "https://github.com/invalid-owner-xyz-999/nonexistent-repo-999" },
  ];

  for (const repo of repos) {
    const t0 = Date.now();
    try {
      const res = await runEngineeringAnalysis(repo.url);
      const timeMs = Date.now() - t0;
      console.log(`[${repo.label}]: ${repo.url} | Status: ${res.status} | Score: ${res.score}% | Stars: ${res.details.starsCount} | Branch: ${res.details.defaultBranch} | README: ${res.details.hasReadme} | LICENSE: ${res.details.hasLicense} | Time: ${timeMs}ms`);
    } catch (e: any) {
      console.log(`[${repo.label}]: Failed: ${e.message}`);
    }
  }
}

async function runAll() {
  await testWebsiteScraper();
  await testGitHubAnalysis();
}

runAll();
