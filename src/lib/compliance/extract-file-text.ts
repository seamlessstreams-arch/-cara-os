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
//   • .xlsx                → unzip (jszip) → shared + inline string cells
//     (text only — numbers/formulas deliberately not read, and said so)
//   • .eml                 → human headers + text body; .msg (binary Outlook)
//     is refused honestly — save as .eml or paste
// The XML→text and email steps are pure functions so they can be unit-tested.
// ══════════════════════════════════════════════════════════════════════════════

export type ExtractKind = "txt" | "docx" | "pdf" | "xlsx" | "eml" | "unsupported";

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

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

/** Pull every text cell out of workbook XML (shared + inline strings). Pure.
 *  Numbers and formulas are deliberately NOT extracted — only text. */
export function xlsxXmlToText(sharedStringsXml: string | null, sheetXmls: string[]): string {
  const texts: string[] = [];
  const collect = (xml: string) => {
    for (const m of xml.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)) {
      const t = decodeXmlEntities(m[1]).trim();
      if (t) texts.push(t);
    }
  };
  if (sharedStringsXml) collect(sharedStringsXml);
  for (const sheet of sheetXmls) collect(sheet);
  return [...new Set(texts)].join("\n").trim();
}

/** Keep the human parts of an RFC822 email — From/To/Cc/Subject/Date + the
 *  text body — and drop transport noise (Received chains, MIME scaffolding).
 *  Pure. */
export function emlToText(raw: string): string {
  const normalised = raw.replace(/\r\n/g, "\n");
  const split = normalised.indexOf("\n\n");
  const headerBlock = split === -1 ? normalised : normalised.slice(0, split);
  let body = split === -1 ? "" : normalised.slice(split + 2);

  // Unfold continuation lines, then keep only the human headers.
  const unfolded = headerBlock.replace(/\n[ \t]+/g, " ");
  const kept: string[] = [];
  for (const line of unfolded.split("\n")) {
    if (/^(From|To|Cc|Subject|Date):/i.test(line)) kept.push(line.trim());
  }

  // Multipart: prefer the text/plain part; otherwise strip part scaffolding.
  const boundaryMatch = unfolded.match(/boundary="?([^";\n]+)"?/i);
  if (boundaryMatch) {
    const parts = body.split(new RegExp(`--${boundaryMatch[1].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:--)?`));
    const plain = parts.find((p) => /content-type:\s*text\/plain/i.test(p)) ?? parts.find((p) => p.trim());
    if (plain) {
      const bodySplit = plain.replace(/\r\n/g, "\n").indexOf("\n\n");
      body = bodySplit === -1 ? plain : plain.slice(bodySplit + 2);
    }
  }
  // Quoted-printable soft breaks and =XX escapes (the common cases).
  body = body
    .replace(/=\n/g, "")
    .replace(/=([0-9A-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));

  return `${kept.join("\n")}\n\n${body.trim()}`.replace(/\n{3,}/g, "\n\n").trim();
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

  if (name.endsWith(".xlsx")) {
    try {
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(await file.arrayBuffer());
      const shared = (await zip.file("xl/sharedStrings.xml")?.async("string")) ?? null;
      const sheetNames = Object.keys(zip.files)
        .filter((k) => /^xl\/worksheets\/sheet\d+\.xml$/.test(k))
        .sort();
      const sheets = await Promise.all(sheetNames.map((k) => zip.file(k)!.async("string")));
      const text = xlsxXmlToText(shared, sheets);
      return text.length >= 20
        ? { text, kind: "xlsx", note: "Text cells extracted — numbers and formulas aren't read." }
        : { text, kind: "xlsx", note: "That spreadsheet had very little readable text (only text cells are extracted, not numbers) — paste anything important." };
    } catch {
      return { text: "", kind: "xlsx", note: "Couldn't read that spreadsheet — paste the relevant text instead." };
    }
  }

  if (name.endsWith(".eml")) {
    try {
      const text = emlToText(await file.text());
      return text.length >= 20
        ? { text, kind: "eml" }
        : { text, kind: "eml", note: "Couldn't find readable text in that email — paste it instead." };
    } catch {
      return { text: "", kind: "eml", note: "Couldn't read that email file — paste the text instead." };
    }
  }

  if (name.endsWith(".msg")) {
    return { text: "", kind: "unsupported", note: "Outlook .msg files can't be read here — save the email as .eml, or paste the text." };
  }

  return { text: "", kind: "unsupported", note: "Unsupported file type — PDF, Word, Excel, email (.eml) and text files read automatically; paste the text for anything else." };
}
