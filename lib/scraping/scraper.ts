import * as cheerio from "cheerio";

export interface ScrapedPageData {
  url: string;
  title: string;
  metaDescription: string;
  headings: { level: string; text: string }[];
  buttons: string[];
  links: { text: string; href: string }[];
  images: { alt: string; src: string }[];
  hasViewportMeta: boolean;
  textLength: number;
  bodyText: string;
  htmlContent: string;
  fetchTimeMs: number;
}

export async function scrapeLandingPage(targetUrl: string): Promise<ScrapedPageData | null> {
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 ProdexaBot/1.0",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return null;
    }

    const html = await res.text();
    const fetchTimeMs = Date.now() - startTime;
    const $ = cheerio.load(html);

    const title = $("title").text().trim() || "";
    const metaDescription =
      $('meta[name="description"]').attr("content") ||
      $('meta[property="og:description"]').attr("content") ||
      "";

    const headings: { level: string; text: string }[] = [];
    $("h1, h2, h3").each((_, el) => {
      const text = $(el).text().trim();
      if (text) {
        headings.push({ level: el.tagName.toLowerCase(), text });
      }
    });

    const buttons: string[] = [];
    $("button, a.btn, a[class*='button'], a[class*='btn']").each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length < 50) {
        buttons.push(text);
      }
    });

    const links: { text: string; href: string }[] = [];
    $("a").each((_, el) => {
      const text = $(el).text().trim();
      const href = $(el).attr("href") || "";
      if (text && href) {
        links.push({ text, href });
      }
    });

    const images: { alt: string; src: string }[] = [];
    $("img").each((_, el) => {
      const alt = $(el).attr("alt") || "";
      const src = $(el).attr("src") || "";
      images.push({ alt, src });
    });

    const hasViewportMeta = $('meta[name="viewport"]').length > 0;
    const bodyText = $("body").text().replace(/\s+/g, " ").trim();

    return {
      url: targetUrl,
      title,
      metaDescription,
      headings,
      buttons,
      links,
      images,
      hasViewportMeta,
      textLength: bodyText.length,
      bodyText: bodyText.substring(0, 4000), // capped
      htmlContent: html.substring(0, 10000),
      fetchTimeMs,
    };
  } catch (error) {
    console.warn("Failed to scrape landing page:", targetUrl, error);
    return null;
  }
}
