export function stripHtml(html: string): string {
  let text = html.replace(/<script[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<style[\s\S]*?<\/style>/gi, "");
  text = text.replace(/<[^>]+>/g, " ");
  text = text.replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
  text = text.replace(/\s+/g, " ").trim();
  return text;
}

/** Validate that a URL is safe to fetch (no SSRF) */
function validateUrl(urlString: string): void {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    throw new Error("Invalid URL");
  }

  // Only allow http/https
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs are allowed");
  }

  const hostname = url.hostname.toLowerCase();

  // Block localhost and loopback
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "[::1]" ||
    hostname === "0.0.0.0"
  ) {
    throw new Error("Local addresses are not allowed");
  }

  // Block private IP ranges
  const parts = hostname.split(".").map(Number);
  if (parts.length === 4 && parts.every((p) => !isNaN(p))) {
    const [a, b] = parts;
    if (
      a === 10 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a === 0
    ) {
      throw new Error("Private IP addresses are not allowed");
    }
    // Block AWS/cloud metadata endpoint
    if (hostname === "169.254.169.254") {
      throw new Error("Metadata endpoints are not allowed");
    }
  }

  // Block common cloud metadata hostnames
  if (
    hostname === "metadata.google.internal" ||
    hostname === "metadata.google.com"
  ) {
    throw new Error("Metadata endpoints are not allowed");
  }
}

export async function extractTextFromUrl(url: string): Promise<string> {
  validateUrl(url);

  const response = await fetch(url, {
    headers: { "User-Agent": "3DPDiamonds-Bot/1.0" },
    signal: AbortSignal.timeout(15000),
    redirect: "error", // Don't follow redirects that could lead to internal resources
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status}`);
  }
  const contentType = response.headers.get("content-type") || "";
  const html = await response.text();
  if (contentType.includes("text/plain")) return html.trim();
  return stripHtml(html);
}

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // pdf-parse v2 uses a class-based API
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PDFParse } = require("pdf-parse");
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await parser.getText();
  await parser.destroy();
  return result.text;
}
