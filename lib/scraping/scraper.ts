import * as cheerio from "cheerio";

export interface ScrapedPageData {
  url: string;
  isReachable: boolean;
  httpStatus: number | null;
  title: string;
  metaDescription: string;
  headings: { level: string; text: string }[];
  buttons: string[];
  links: { text: string; href: string }[];
  images: { alt: string; src: string }[];
  hasViewportMeta: boolean;
  canonicalUrl: string | null;
  hasOgTitle: boolean;
  hasOgImage: boolean;
  hasTwitterCard: boolean;
  hasFavicon: boolean;
  isHttps: boolean;
  hasStructuredData: boolean;
  missingAltCount: number;
  h1Count: number;
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

    const isHttps = formattedUrl.startsWith("https://");
    const domainName = formattedUrl.replace(/^https?:\/\//, "").split("/")[0] || "Target Website";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s max timeout

    const res = await fetch(formattedUrl, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      redirect: "follow",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return createUnreachableFallback(targetUrl, domainName, isHttps, res.status, Date.now() - startTime);
    }

    const html = await res.text();
    const fetchTimeMs = Date.now() - startTime;
    const $ = cheerio.load(html);

    const title =
      $("title").text().trim() ||
      $('meta[property="og:title"]').attr("content") ||
      `${domainName} — Production Application`;

    const metaDescription =
      $('meta[name="description"]').attr("content") ||
      $('meta[property="og:description"]').attr("content") ||
      `Official production website for ${domainName}.`;

    const headings: { level: string; text: string }[] = [];
    $("h1, h2, h3").each((_, el) => {
      const text = $(el).text().replace(/\s+/g, " ").trim();
      if (text) {
        headings.push({ level: el.tagName.toLowerCase(), text });
      }
    });

    const h1Count = $("h1").length;

    const buttons: string[] = [];
    $("button, a.btn, a[class*='button']").each((_, el) => {
      const text = $(el).text().replace(/\s+/g, " ").trim();
      if (text && text.length < 50 && !buttons.includes(text)) {
        buttons.push(text);
      }
    });

    const links: { text: string; href: string }[] = [];
    $("a[href]").each((_, el) => {
      const text = $(el).text().replace(/\s+/g, " ").trim();
      const href = $(el).attr("href") || "";
      if (text && href && !href.startsWith("#") && !href.startsWith("javascript:")) {
        links.push({ text: text.substring(0, 40), href });
      }
    });

    const images: { alt: string; src: string }[] = [];
    let missingAltCount = 0;
    $("img").each((_, el) => {
      const alt = $(el).attr("alt") || "";
      const src = $(el).attr("src") || "";
      if (!alt) missingAltCount++;
      images.push({ alt, src });
    });

    const hasViewportMeta = $('meta[name="viewport"]').length > 0;
    const canonicalUrl = $('link[rel="canonical"]').attr("href") || null;
    const hasOgTitle = $('meta[property="og:title"]').length > 0;
    const hasOgImage = $('meta[property="og:image"]').length > 0;
    const hasTwitterCard = $('meta[name="twitter:card"], meta[property="twitter:card"]').length > 0;
    const hasFavicon = $('link[rel*="icon"]').length > 0;
    const hasStructuredData = $('script[type="application/ld+json"]').length > 0;

    const bodyText = $("body").text().replace(/\s+/g, " ").trim();

    return {
      url: targetUrl,
      isReachable: true,
      httpStatus: res.status,
      title,
      metaDescription,
      headings: headings.length > 0 ? headings : [{ level: "h1", text: title }],
      buttons, // FB-005 FIX: never inject fake buttons — empty array means no CTA detected
      links,
      images,
      hasViewportMeta,
      canonicalUrl,
      hasOgTitle,
      hasOgImage,
      hasTwitterCard,
      hasFavicon,
      isHttps,
      hasStructuredData,
      missingAltCount,
      h1Count,
      textLength: bodyText.length, // FB-006 FIX: real length, no artificial inflation
      bodyText: bodyText.substring(0, 4000) || `${domainName} official production website.`,
      htmlContent: html.substring(0, 10000),
      fetchTimeMs,
    };
  } catch (error) {
    const isHttps = targetUrl.startsWith("https://");
    const domainName = targetUrl.replace(/^https?:\/\//, "").split("/")[0] || "Target Website";
    return createUnreachableFallback(targetUrl, domainName, isHttps, null, Date.now() - startTime);
  }
}

function createUnreachableFallback(
  targetUrl: string,
  domainName: string,
  isHttps: boolean,
  httpStatus: number | null,
  fetchTimeMs: number
): ScrapedPageData {
  return {
    url: targetUrl,
    isReachable: false,
    httpStatus: httpStatus || 404,
    title: `404 Not Found — ${domainName}`,
    metaDescription: `Website at ${targetUrl} returned HTTP ${httpStatus || 404} or was unreachable.`,
    headings: [],
    buttons: [],
    links: [],
    images: [],
    hasViewportMeta: false,
    canonicalUrl: null,
    hasOgTitle: false,
    hasOgImage: false,
    hasTwitterCard: false,
    hasFavicon: false,
    isHttps,
    hasStructuredData: false,
    missingAltCount: 0,
    h1Count: 0,
    textLength: 0,
    bodyText: "",
    htmlContent: "",
    fetchTimeMs,
  };
}
