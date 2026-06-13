// ══════════════════════════════════════════════════════════════════════════════
// CARA — Client-side document text extraction
//
// Pulls plain text out of an uploaded file IN THE BROWSER, so a sensitive
// compliance document never leaves the device as a binary — only the extracted
// text is posted to the (unchanged) ingest engine. Supports:
//   • .txt / .md / text/*  → read directly
//   • .docx                → unzip (jszip) → strip WordprocessingML → text
//   • .pdf                 → not extracted client-side yet (paste the text)
// The XML→text step is a pure function so it can be unit-tested.
// ══════════════════════════════════════════════════════════════════════════════

export type ExtractKind = "txt" | "docx" | "pdf" | "unsupported";

export interface ExtractResult {
  text: string;
  kind: ExtractKind;
  /** Human message when text couldn't be extracted (kind handled but empty). */
  note?: string;
}

/** Convert WordprocessingML (word/document.xml) to readable plain text. Pure. */
export function docxXmlToText(xml: string): string {
  return xml
    .replace(/<w:tab\b[^>]*\/?>/g, " ")
    .replace(/<w:br\b[^>]*\/?>/g, "\n")
    .replace(/<\/w:p>/g, "\n") // paragraph end → newline
    .replace(/<[^>]+>/g, "") // strip remaining tags
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

const MAX_BYTES = 5 * 1024 * 1024; // 5MB guard

/** Extract text from a file in the browser. Never throws for handled types. */
export async function extractFileText(file: File): Promise<ExtractResult> {
  const name = file.name.toLowerCase();
  if (file.size > MAX_BYTES) {
    return { text: "", kind: "unsupported", note: "That file is over 5MB — paste the relevant text instead." };
  }

  if (name.endsWith(".txt") || name.endsWith(".md") || name.endsWith(".csv") || file.type.startsWith("text/")) {
    return { text: (await file.text()).trim(), kind: "txt" };
  }

  if (name.endsWith(".docx")) {
    try {
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(await file.arrayBuffer());
      const xml = await zip.file("word/document.xml")?.async("string");
      if (!xml) return { text: "", kind: "docx", note: "Couldn't find readable text in that Word file — paste it instead." };
      const text = docxXmlToText(xml);
      return text.length >= 20
        ? { text, kind: "docx" }
        : { text, kind: "docx", note: "That Word file had very little readable text — check it's the right document, or paste the text." };
    } catch {
      return { text: "", kind: "docx", note: "Couldn't read that Word file — paste the text instead." };
    }
  }

  if (name.endsWith(".pdf")) {
    return { text: "", kind: "pdf", note: "PDF text isn't read here yet — open the PDF, copy the text and paste it. (.docx and .txt upload directly.)" };
  }

  return { text: "", kind: "unsupported", note: "Unsupported file type — upload a .docx or .txt, or paste the text." };
}
