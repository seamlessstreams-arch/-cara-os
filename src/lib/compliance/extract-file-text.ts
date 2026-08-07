// ══════════════════════════════════════════════════════════════════════════════
// CARA — Client-side document text extraction
//
// Pulls plain text out of an uploaded file IN THE BROWSER, so a sensitive
// compliance document never leaves the device as a binary — only the extracted
// text is posted to the (unchanged) ingest engine. Supports:
//   • .txt / .md / text/*  → read directly
//   • .docx                → unzip (jszip) → strip WordprocessingML → text
//   • .pdf                 → text layer via pdfjs-dist (dynamic import, so the
//     library is only fetched when a PDF is actually picked); a scanned PDF
//     with no text layer is stated honestly — never guessed at
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
    try {
      // The legacy build runs in every environment (browser AND the node test
      // runner); the modern build needs DOM APIs node lacks. Importing the
      // worker module registers globalThis.pdfjsWorker, so parsing runs
      // main-thread with no worker asset URL — the bundler-magic
      // `new URL(..., import.meta.url)` pattern breaks outside webpack.
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      // @ts-expect-error — the worker module ships no type declarations; it is
      // imported purely for its globalThis.pdfjsWorker side effect.
      await import("pdfjs-dist/legacy/build/pdf.worker.mjs");
      const loadingTask = pdfjs.getDocument({
        data: new Uint8Array(await file.arrayBuffer()),
        disableFontFace: true,
      });
      const doc = await loadingTask.promise;
      const MAX_PAGES = 100;
      const pages = Math.min(doc.numPages, MAX_PAGES);
      let out = "";
      for (let p = 1; p <= pages; p++) {
        const page = await doc.getPage(p);
        const content = await page.getTextContent();
        out += content.items.map((it) => ("str" in it ? it.str : "")).join(" ") + "\n";
      }
      const truncated = doc.numPages > MAX_PAGES;
      await loadingTask.destroy();
      const text = out.replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
      if (text.length < 20) {
        return { text: "", kind: "pdf", note: "That PDF has no readable text layer (it's likely a scan) — paste the text instead." };
      }
      return truncated
        ? { text, kind: "pdf", note: `Read the first ${MAX_PAGES} pages of ${doc.numPages} — paste anything important from the rest.` }
        : { text, kind: "pdf" };
    } catch {
      return { text: "", kind: "pdf", note: "Couldn't read that PDF — paste the text instead." };
    }
  }

  return { text: "", kind: "unsupported", note: "Unsupported file type — upload a .docx or .txt, or paste the text." };
}
