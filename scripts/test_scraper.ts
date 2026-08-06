import { scrapeLandingPage } from "../lib/scraping/scraper";

async function run() {
  console.log("=== EMPIRICAL TEST: SCRAPE LIVE LANDING PAGE ===");
  const res = await scrapeLandingPage("https://nextjs.org");
  console.log("Title:", res?.title);
  console.log("Meta Description:", res?.metaDescription);
  console.log("Fetch Time:", res?.fetchTimeMs, "ms");
  console.log("Headings Count:", res?.headings.length);
}

run();
