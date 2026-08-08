import { describe, expect, it } from "vitest";
import { docxXmlToText, emlToText, extractFileText, xlsxXmlToText } from "../extract-file-text";

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

describe("xlsxXmlToText", () => {
  it("collects shared and inline string cells, deduped, entities decoded", () => {
    const shared = `<sst><si><t>Medication log</t></si><si><r><t>Fire &amp; safety</t></r><r><t> check</t></r></si></sst>`;
    const sheet = `<worksheet><sheetData><row><c t="inlineStr"><is><t>Weekly rota</t></is></c><c><v>42</v></c></row></sheetData></worksheet>`;
    const text = xlsxXmlToText(shared, [sheet]);
    expect(text).toContain("Medication log");
    expect(text).toContain("Fire & safety");
    expect(text).toContain("Weekly rota");
    expect(text).not.toContain("42");
  });
});

describe("emlToText", () => {
  it("keeps human headers and the body, drops transport noise", () => {
    const raw = [
      "Received: from mail.example.com by mx (Postfix)",
      "From: LA Placements <placements@la.gov.uk>",
      "To: manager@oakhouse.example",
      "Subject: Strategy meeting follow-up for",
      " Alex",
      "Date: Thu, 7 Aug 2026 10:00:00 +0100",
      "",
      "Please find the actions from yesterday's strategy meeting attached.",
    ].join("\r\n");
    const text = emlToText(raw);
    expect(text).toContain("Subject: Strategy meeting follow-up for Alex");
    expect(text).toContain("From: LA Placements");
    expect(text).toContain("actions from yesterday's strategy meeting");
    expect(text).not.toContain("Received:");
  });

  it("prefers the text/plain part of a multipart email and decodes quoted-printable", () => {
    const raw = [
      'Content-Type: multipart/alternative; boundary="BOUND"',
      "Subject: Review",
      "",
      "--BOUND",
      "Content-Type: text/plain",
      "Content-Transfer-Encoding: quoted-printable",
      "",
      "Placement review =E2=80=94 all actions=",
      " complete.",
      "--BOUND",
      "Content-Type: text/html",
      "",
      "<p>Placement review</p>",
      "--BOUND--",
    ].join("\n");
    const text = emlToText(raw);
    expect(text).toContain("all actions complete");
    expect(text).not.toContain("<p>");
  });
});

describe("extractFileText — xlsx and eml files", () => {
  it("reads text cells from a real .xlsx built with jszip", async () => {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    zip.file("xl/sharedStrings.xml", "<sst><si><t>Safeguarding audit actions for Q3</t></si></sst>");
    zip.file("xl/worksheets/sheet1.xml", '<worksheet><c t="inlineStr"><is><t>Overdue: fire drill record</t></is></c></worksheet>');
    const buf = await zip.generateAsync({ type: "arraybuffer" });
    const result = await extractFileText(new File([buf], "audit.xlsx"));
    expect(result.kind).toBe("xlsx");
    expect(result.text).toContain("Safeguarding audit actions for Q3");
    expect(result.text).toContain("Overdue: fire drill record");
    expect(result.note).toContain("numbers and formulas aren't read");
  });

  it("refuses .msg honestly and points at .eml", async () => {
    const result = await extractFileText(new File(["binary"], "email.msg"));
    expect(result.kind).toBe("unsupported");
    expect(result.note).toContain(".eml");
  });
});
