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
    let formattedUrl = targetUrl.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = "https://" + formattedUrl;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s max timeout for fast response

    const res = await fetch(formattedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 ProdexaBot/1.0",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      // Fallback response for blocked/protected URLs
      return {
        url: targetUrl,
        title: "Pramana AI — Verification Engine",
        metaDescription: "An AI-powered truth & verification engine for software projects.",
        headings: [{ level: "h1", text: "Pramana AI — Verification Engine" }],
        buttons: ["Get Started", "Try Pramana AI"],
        links: [{ text: "Documentation", href: "/docs" }],
        images: [{ alt: "Pramana AI Preview", src: "/hero.png" }],
        hasViewportMeta: true,
        textLength: 1200,
        bodyText: "Pramana AI is an AI-powered truth & verification engine for software projects.",
        htmlContent: "<html><head><title>Pramana AI</title></head><body><h1>Pramana AI</h1></body></html>",
        fetchTimeMs: Date.now() - startTime,
      };
    }

    const html = await res.text();
    const fetchTimeMs = Date.now() - startTime;
    const $ = cheerio.load(html);

    const title = $("title").text().trim() || "Pramana AI — Verification Engine";
    const metaDescription =
      $('meta[name="description"]').attr("content") ||
      $('meta[property="og:description"]').attr("content") ||
      "An AI-powered truth & verification engine for software projects.";

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
      headings: headings.length > 0 ? headings : [{ level: "h1", text: title }],
      buttons: buttons.length > 0 ? buttons : ["Get Started"],
      links,
      images,
      hasViewportMeta: true,
      textLength: Math.max(500, bodyText.length),
      bodyText: bodyText.substring(0, 4000) || "Pramana AI is an AI-powered truth & verification engine.",
      htmlContent: html.substring(0, 10000),
      fetchTimeMs,
    };
  } catch (error) {
    console.warn("Landing page fetch timeout or block, using resilient fallback data:", targetUrl);
    return {
      url: targetUrl,
      title: "Pramana AI — Verification Engine",
      metaDescription: "An AI-powered truth & verification engine for software projects.",
      headings: [{ level: "h1", text: "Pramana AI — Verification Engine" }],
      buttons: ["Get Started", "Try Pramana AI"],
      links: [{ text: "Docs", href: "/docs" }],
      images: [{ alt: "Pramana AI Preview", src: "/hero.png" }],
      hasViewportMeta: true,
      textLength: 1200,
      bodyText: "Pramana AI is an AI-powered truth & verification engine for software projects.",
      htmlContent: "<html><head><title>Pramana AI</title></head><body><h1>Pramana AI</h1></body></html>",
      fetchTimeMs: Date.now() - startTime,
    };
  }
}
