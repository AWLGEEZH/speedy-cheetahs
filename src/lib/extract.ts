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

export async function extractTextFromUrl(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { "User-Agent": "3DPDiamonds-Bot/1.0" },
    signal: AbortSignal.timeout(15000),
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
