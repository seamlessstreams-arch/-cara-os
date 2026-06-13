import { describe, expect, it } from "vitest";
import { docxXmlToText } from "../extract-file-text";

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
