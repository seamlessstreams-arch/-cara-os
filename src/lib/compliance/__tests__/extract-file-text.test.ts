import { describe, expect, it } from "vitest";
import { docxXmlToText, extractFileText } from "../extract-file-text";

describe("docxXmlToText", () => {
  it("turns WordprocessingML paragraphs into readable lines", () => {
    const xml = `<w:document><w:body>
      <w:p><w:r><w:t>Statement of Purpose 2026</w:t></w:r></w:p>
      <w:p><w:r><w:t>Next review date: 1 March 2027</w:t></w:r></w:p>
      <w:p><w:r><w:t>Action: update the fire risk assessment</w:t></w:r></w:p>
    </w:body></w:document>`;
    const text = docxXmlToText(xml);
    expect(text).toContain("Statement of Purpose 2026");
    expect(text).toContain("Next review date: 1 March 2027");
    expect(text).toContain("Action: update the fire risk assessment");
    // paragraphs separated by newlines
    expect(text.split("\n").length).toBeGreaterThanOrEqual(3);
  });

  it("handles split runs, tabs, breaks and XML entities", () => {
    const xml = `<w:p><w:r><w:t>Fire </w:t></w:r><w:r><w:t>&amp; Safety</w:t></w:r><w:tab/><w:r><w:t>review</w:t></w:r><w:br/><w:r><w:t>by 2026</w:t></w:r></w:p>`;
    const text = docxXmlToText(xml);
    expect(text).toContain("Fire & Safety");
    expect(text).toContain("review");
    expect(text).toContain("by 2026");
  });

  it("strips all markup and collapses whitespace", () => {
    expect(docxXmlToText("<w:p><w:r><w:t>Hello</w:t></w:r></w:p>")).toBe("Hello");
    expect(docxXmlToText("<w:p><w:t>a</w:t></w:p><w:p><w:t>b</w:t></w:p>")).toBe("a\nb");
  });
});

// A minimal single-page PDF with a real text layer ("Hello Cara"). pdf.js
// tolerates imperfect xref offsets by rebuilding via its recovery scan.
const TINY_PDF = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 75 >> stream
BT /F1 12 Tf 20 100 Td (Hello Cara referral summary for review 2026) Tj ET
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
trailer << /Root 1 0 R >>
%%EOF`;

describe("extractFileText — pdf", () => {
  it("reads the text layer of a real PDF in-process", async () => {
    const file = new File([TINY_PDF], "referral.pdf", { type: "application/pdf" });
    const result = await extractFileText(file);
    expect(result.kind).toBe("pdf");
    expect(result.text).toContain("Hello Cara referral summary");
  });

  it("degrades honestly on a garbage .pdf (empty text + a note, never a throw)", async () => {
    const file = new File(["not a pdf at all"], "broken.pdf", { type: "application/pdf" });
    const result = await extractFileText(file);
    expect(result.kind).toBe("pdf");
    expect(result.text).toBe("");
    expect(result.note).toBeTruthy();
  });
});
